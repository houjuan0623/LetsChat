import URL from 'url';
import querystring from 'querystring';

import { Meteor } from 'meteor/meteor';
import { HTTPInternals } from 'meteor/http';
import { camelCase } from 'change-case';
import _ from 'underscore';
import iconv from 'iconv-lite';
import ipRangeCheck from 'ip-range-check';
import he from 'he';
import jschardet from 'jschardet';

import { OEmbedCache, Messages } from '../../models';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { isURL } from '../../utils/lib/isURL';
import { SystemLogger } from '../../../server/lib/logger/system';

const request = HTTPInternals.NpmModules.request.module;
const OEmbed = {};

//  Detect encoding
//  Priority:
//  Detected == HTTP Header > Detected == HTML meta > HTTP Header > HTML meta > Detected > Default (utf-8)
//  See also: https://www.w3.org/International/questions/qa-html-encoding-declarations.en#quickanswer
const getCharset = function(contentType, body) {
	let detectedCharset;
	let httpHeaderCharset;
	let htmlMetaCharset;
	let result;

	contentType = contentType || '';

	const binary = body.toString('binary');
	const detected = jschardet.detect(binary);
	if (detected.confidence > 0.8) {
		detectedCharset = detected.encoding.toLowerCase();
	}
	const m1 = contentType.match(/charset=([\w\-]+)/i);
	if (m1) {
		httpHeaderCharset = m1[1].toLowerCase();
	}
	const m2 = binary.match(/<meta\b[^>]*charset=["']?([\w\-]+)/i);
	if (m2) {
		htmlMetaCharset = m2[1].toLowerCase();
	}
	if (detectedCharset) {
		if (detectedCharset === httpHeaderCharset) {
			result = httpHeaderCharset;
		} else if (detectedCharset === htmlMetaCharset) {
			result = htmlMetaCharset;
		}
	}
	if (!result) {
		result = httpHeaderCharset || htmlMetaCharset || detectedCharset;
	}
	return result || 'utf-8';
};

const toUtf8 = function(contentType, body) {
	return iconv.decode(body, getCharset(contentType, body));
};

const getUrlContent = Meteor.wrapAsync(function(urlObj, redirectCount = 5, callback) {
	if (_.isString(urlObj)) {
		urlObj = URL.parse(urlObj);
	}

	const portsProtocol = {
		80: 'http:',
		8080: 'http:',
		443: 'https:',
	};

	const parsedUrl = _.pick(urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search', 'hostname']);
	const ignoredHosts = settings.get('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') || [];
	if (ignoredHosts.includes(parsedUrl.hostname) || ipRangeCheck(parsedUrl.hostname, ignoredHosts)) {
		return callback();
	}

	const safePorts = settings.get('API_EmbedSafePorts').replace(/\s/g, '').split(',') || [];

	if (safePorts.length > 0 && parsedUrl.port && !safePorts.includes(parsedUrl.port)) {
		return callback();
	}

	if (safePorts.length > 0 && !parsedUrl.port && !safePorts.some((port) => portsProtocol[port] === parsedUrl.protocol)) {
		return callback();
	}

	const data = callbacks.run('oembed:beforeGetUrlContent', {
		urlObj,
		parsedUrl,
	});
	if (data.attachments != null) {
		return callback(null, data);
	}
	const url = URL.format(data.urlObj);
	const opts = {
		url,
		strictSSL: !settings.get('Allow_Invalid_SelfSigned_Certs'),
		gzip: true,
		maxRedirects: redirectCount,
		headers: {
			'User-Agent': settings.get('API_Embed_UserAgent'),
			'Accept-Language': settings.get('Language') || 'en',
		},
	};
	let headers = null;
	let statusCode = null;
	let error = null;
	const chunks = [];
	let chunksTotalLength = 0;
	const stream = request(opts);
	stream.on('response', function(response) {
		statusCode = response.statusCode;
		headers = response.headers;
		if (response.statusCode !== 200) {
			return stream.abort();
		}
	});
	stream.on('data', function(chunk) {
		chunks.push(chunk);
		chunksTotalLength += chunk.length;
		if (chunksTotalLength > 250000) {
			return stream.abort();
		}
	});
	stream.on('end', Meteor.bindEnvironment(function() {
		if (error != null) {
			return callback(null, {
				error,
				parsedUrl,
			});
		}
		const buffer = Buffer.concat(chunks);
		return callback(null, {
			headers,
			body: toUtf8(headers['content-type'], buffer),
			parsedUrl,
			statusCode,
		});
	}));
	return stream.on('error', function(err) {
		error = err;
	});
});

OEmbed.getUrlMeta = function(url, withFragment) {
	const urlObj = URL.parse(url);
	if (withFragment != null) {
		const queryStringObj = querystring.parse(urlObj.query);
		queryStringObj._escaped_fragment_ = '';
		urlObj.query = querystring.stringify(queryStringObj);
		let path = urlObj.pathname;
		if (urlObj.query != null) {
			path += `?${ urlObj.query }`;
			urlObj.search = `?${ urlObj.query }`;
		}
		urlObj.path = path;
	}
	const content = getUrlContent(urlObj, 5);
	if (!content) {
		return;
	}
	if (content.attachments != null) {
		return content;
	}
	let metas = undefined;
	if (content && content.body) {
		metas = {};
		const escapeMeta = (name, value) => {
			metas[name] = metas[name] || he.unescape(value);
			return metas[name];
		};
		content.body.replace(/<title[^>]*>([^<]*)<\/title>/gmi, function(meta, title) {
			return escapeMeta('pageTitle', title);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gmi, function(meta, name, value) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gmi, function(meta, name, value) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gmi, function(meta, value, name) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gmi, function(meta, value, name) {
			return escapeMeta(camelCase(name), value);
		});
		if (metas.fragment === '!' && (withFragment == null)) {
			return OEmbed.getUrlMeta(url, true);
		}
		delete metas.oembedHtml;
	}
	let headers = undefined;

	if (content?.headers) {
		headers = {};
		const headerObj = content.headers;
		Object.keys(headerObj).forEach((header) => {
			headers[camelCase(header)] = headerObj[header];
		});
	}
	if (content && content.statusCode !== 200) {
		return;
	}
	return callbacks.run('oembed:afterParseContent', {
		url,
		meta: metas,
		headers,
		parsedUrl: content.parsedUrl,
		content,
	});
};

OEmbed.getUrlMetaWithCache = function(url, withFragment) {
	const cache = OEmbedCache.findOneById(url);

	if (cache != null) {
		return cache.data;
	}
	const data = OEmbed.getUrlMeta(url, withFragment);
	if (data != null) {
		try {
			OEmbedCache.createWithIdAndData(url, data);
		} catch (_error) {
			SystemLogger.error('OEmbed duplicated record', url);
		}
		return data;
	}
};

const getRelevantHeaders = function(headersObj) {
	const headers = {};
	Object.keys(headersObj).forEach((key) => {
		const value = headersObj[key];
		const lowerCaseKey = key.toLowerCase();
		if ((lowerCaseKey === 'contenttype' || lowerCaseKey === 'contentlength') && (value && value.trim() !== '')) {
			headers[key] = value;
		}
	});

	if (Object.keys(headers).length > 0) {
		return headers;
	}
};

const getRelevantMetaTags = function(metaObj) {
	const tags = {};
	Object.keys(metaObj).forEach((key) => {
		const value = metaObj[key];
		if (/^(og|fb|twitter|oembed|msapplication).+|description|title|pageTitle$/.test(key.toLowerCase()) && (value && value.trim() !== '')) {
			tags[key] = value;
		}
	});

	if (Object.keys(tags).length > 0) {
		return tags;
	}
};

const insertMaxWidthInOembedHtml = (oembedHtml) => oembedHtml?.replace('iframe', 'iframe style=\"max-width: 100%;width:400px;height:225px\"');

OEmbed.rocketUrlParser = function(message) {
	if (Array.isArray(message.urls)) {
		let attachments = [];
		let changed = false;
		message.urls.forEach(function(item) {
			if (item.ignoreParse === true) {
				return;
			}
			if (!isURL(item.url)) {
				return;
			}
			const data = OEmbed.getUrlMetaWithCache(item.url);
			if (data != null) {
				if (data.attachments) {
					attachments = _.union(attachments, data.attachments);
					return;
				}
				if (data.meta != null) {
					item.meta = getRelevantMetaTags(data.meta);
					if (item.meta && item.meta.oembedHtml) {
						item.meta.oembedHtml = insertMaxWidthInOembedHtml(item.meta.oembedHtml);
					}
				}
				if (data.headers != null) {
					item.headers = getRelevantHeaders(data.headers);
				}
				item.parsedUrl = data.parsedUrl;
				changed = true;
			}
		});
		if (attachments.length) {
			Messages.setMessageAttachments(message._id, attachments);
		}
		if (changed === true) {
			Messages.setUrlsById(message._id, message.urls);
		}
	}
	return message;
};

settings.get('API_Embed', function(key, value) {
	if (value) {
		return callbacks.add('afterSaveMessage', OEmbed.rocketUrlParser, callbacks.priority.LOW, 'API_Embed');
	}
	return callbacks.remove('afterSaveMessage', 'API_Embed');
});

export { OEmbed };
