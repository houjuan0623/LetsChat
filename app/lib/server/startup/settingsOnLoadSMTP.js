import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

const buildMailURL = _.debounce(function() {
	SystemLogger.info('Updating process.env.MAIL_URL');

	if (settings.get('SMTP_Host')) {
		process.env.MAIL_URL = `${ settings.get('SMTP_Protocol') }://`;

		if (settings.get('SMTP_Username') && settings.get('SMTP_Password')) {
			process.env.MAIL_URL += `${ encodeURIComponent(settings.get('SMTP_Username')) }:${ encodeURIComponent(settings.get('SMTP_Password')) }@`;
		}

		process.env.MAIL_URL += encodeURIComponent(settings.get('SMTP_Host'));

		if (settings.get('SMTP_Port')) {
			process.env.MAIL_URL += `:${ parseInt(settings.get('SMTP_Port')) }`;
		}

		process.env.MAIL_URL += `?pool=${ settings.get('SMTP_Pool') }`;

		if (settings.get('SMTP_Protocol') === 'smtp' && settings.get('SMTP_IgnoreTLS')) {
			process.env.MAIL_URL += '&secure=false&ignoreTLS=true';
		}

		return process.env.MAIL_URL;
	}
}, 500);

settings.onload('SMTP_Host', function(key, value) {
	if (_.isString(value)) {
		return buildMailURL();
	}
});

settings.onload('SMTP_Port', function() {
	return buildMailURL();
});

settings.onload('SMTP_Username', function(key, value) {
	if (_.isString(value)) {
		return buildMailURL();
	}
});

settings.onload('SMTP_Password', function(key, value) {
	if (_.isString(value)) {
		return buildMailURL();
	}
});

settings.onload('SMTP_Protocol', function() {
	return buildMailURL();
});

settings.onload('SMTP_Pool', function() {
	return buildMailURL();
});

settings.onload('SMTP_IgnoreTLS', function() {
	return buildMailURL();
});

Meteor.startup(function() {
	return buildMailURL();
});
