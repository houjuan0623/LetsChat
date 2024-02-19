import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { API } from '../../../api/server';
import { getUploadFormData } from '../../../api/server/lib/getUploadFormData';
import { getWorkspaceAccessToken, getUserCloudAccessToken } from '../../../cloud/server';
import { settings } from '../../../settings';
import { Info } from '../../../utils';
import { Settings, Users } from '../../../models/server';
import { Apps } from '../orchestrator';
import { formatAppInstanceForRest } from '../../lib/misc/formatAppInstanceForRest';

const appsEngineVersionForMarketplace = Info.marketplaceApiVersion.replace(/-.*/g, '');
const getDefaultHeaders = () => ({
	'X-Apps-Engine-Version': appsEngineVersionForMarketplace,
});

const purchaseTypes = new Set(['buy', 'subscription']);

export class AppsRestApi {
	constructor(orch, manager) {
		this._orch = orch;
		this._manager = manager;
		this.loadAPI();
	}

	async loadAPI() {
		this.api = new API.ApiClass({
			version: 'apps',
			useDefaultAuth: true,
			prettyJson: false,
			enableCors: false,
			auth: API.getUserAuth(),
		});
		this.addManagementRoutes();
	}

	addManagementRoutes() {
		const orchestrator = this._orch;
		const manager = this._manager;

		const handleError = (message, e) => {
			// when there is no `response` field in the error, it means the request
			// couldn't even make it to the server
			if (!e.hasOwnProperty('response')) {
				orchestrator.getRocketChatLogger().warn(message, e.message);
				return API.v1.internalError('Could not reach the Marketplace');
			}

			orchestrator.getRocketChatLogger().error(message, e.response.data);

			if (e.response.statusCode >= 500 && e.response.statusCode <= 599) {
				return API.v1.internalError();
			}

			if (e.response.statusCode === 404) {
				return API.v1.notFound();
			}

			return API.v1.failure();
		};

		this.api.addRoute('', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const baseUrl = orchestrator.getMarketplaceUrl();

				// Gets the Apps from the marketplace
				if (this.queryParams.marketplace) {
					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					let result;
					try {
						result = HTTP.get(`${ baseUrl }/v1/apps`, {
							headers,
						});
					} catch (e) {
						return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
					}

					if (!result || result.statusCode !== 200) {
						orchestrator.getRocketChatLogger().error('Error getting the Apps:', result.data);
						return API.v1.failure();
					}

					return API.v1.success(result.data);
				}

				if (this.queryParams.categories) {
					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					let result;
					try {
						result = HTTP.get(`${ baseUrl }/v1/categories`, {
							headers,
						});
					} catch (e) {
						orchestrator.getRocketChatLogger().error('Error getting the categories from the Marketplace:', e.response.data);
						return API.v1.internalError();
					}

					if (!result || result.statusCode !== 200) {
						orchestrator.getRocketChatLogger().error('Error getting the categories from the Marketplace:', result.data);
						return API.v1.failure();
					}

					return API.v1.success(result.data);
				}

				if (this.queryParams.buildExternalUrl && this.queryParams.appId) {
					const workspaceId = settings.get('Cloud_Workspace_Id');

					if (!this.queryParams.purchaseType || !purchaseTypes.has(this.queryParams.purchaseType)) {
						return API.v1.failure({ error: 'Invalid purchase type' });
					}

					const token = getUserCloudAccessToken(this.getLoggedInUser()._id, true, 'marketplace:purchase', false);
					if (!token) {
						return API.v1.failure({ error: 'Unauthorized' });
					}

					const subscribeRoute = this.queryParams.details === 'true' ? 'subscribe/details' : 'subscribe';

					const seats = Users.getActiveLocalUserCount();

					return API.v1.success({
						url: `${ baseUrl }/apps/${ this.queryParams.appId }/${
							this.queryParams.purchaseType === 'buy' ? this.queryParams.purchaseType : subscribeRoute
						}?workspaceId=${ workspaceId }&token=${ token }&seats=${ seats }`,
					});
				}

				const apps = manager.get().map(formatAppInstanceForRest);

				return API.v1.success({ apps });
			},
			post() {
				let buff;
				let marketplaceInfo;
				let permissionsGranted;

				if (this.bodyParams.url) {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Installation from url is disabled.' });
					}

					let result;
					try {
						result = HTTP.call('GET', this.bodyParams.url, { npmRequestOptions: { encoding: null } });
					} catch (e) {
						orchestrator.getRocketChatLogger().error('Error getting the app from url:', e.response.data);
						return API.v1.internalError();
					}

					if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = result.content;

					if (this.bodyParams.downloadOnly) {
						return API.v1.success({ buff });
					}
				} else if (this.bodyParams.appId && this.bodyParams.marketplace && this.bodyParams.version) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();

					const downloadPromise = new Promise((resolve, reject) => {
						const token = getWorkspaceAccessToken(true, 'marketplace:download', false);

						HTTP.get(`${ baseUrl }/v2/apps/${ this.bodyParams.appId }/download/${ this.bodyParams.version }?token=${ token }`, {
							headers,
							npmRequestOptions: { encoding: null },
						}, (error, result) => {
							if (error) { reject(error); }

							resolve(result);
						});
					});

					const marketplacePromise = new Promise((resolve, reject) => {
						const token = getWorkspaceAccessToken();

						HTTP.get(`${ baseUrl }/v1/apps/${ this.bodyParams.appId }?appVersion=${ this.bodyParams.version }`, {
							headers: {
								Authorization: `Bearer ${ token }`,
								...headers,
							},
						}, (error, result) => {
							if (error) { reject(error); }

							resolve(result);
						});
					});


					try {
						const [downloadResult, marketplaceResult] = Promise.await(Promise.all([downloadPromise, marketplacePromise]));

						if (!downloadResult.headers['content-type'] || downloadResult.headers['content-type'] !== 'application/zip') {
							throw new Error('Invalid url. It doesn\'t exist or is not "application/zip".');
						}

						buff = downloadResult.content;
						marketplaceInfo = marketplaceResult.data[0];
						permissionsGranted = this.bodyParams.permissionsGranted;
					} catch (err) {
						return API.v1.failure(err.message);
					}
				} else {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Direct installation of an App is disabled.' });
					}

					const formData = Promise.await(getUploadFormData({
						request: this.request,
					}));
					buff = formData?.app?.fileBuffer;
					permissionsGranted = (() => {
						try {
							const permissions = JSON.parse(formData?.permissions || '');
							return permissions.length ? permissions : undefined;
						} catch {
							return undefined;
						}
					})();
				}

				if (!buff) {
					return API.v1.failure({ error: 'Failed to get a file to install for the App. ' });
				}

				const user = orchestrator.getConverters().get('users').convertToApp(Meteor.user());

				const aff = Promise.await(manager.add(buff, { marketplaceInfo, permissionsGranted, enable: true, user }));
				const info = aff.getAppInfo();

				if (aff.hasStorageError()) {
					return API.v1.failure({ status: 'storage_error', messages: [aff.getStorageError()] });
				}

				if (aff.hasAppUserError()) {
					return API.v1.failure({
						status: 'app_user_error',
						messages: [aff.getAppUserError().message],
						payload: { username: aff.getAppUserError().username },
					});
				}

				info.status = aff.getApp().getStatus();

				return API.v1.success({
					app: info,
					implemented: aff.getImplementedInferfaces(),
					licenseValidation: aff.getLicenseValidationResult(),
				});
			},
		});

		this.api.addRoute('externalComponents', { authRequired: false }, {
			get() {
				const externalComponents = orchestrator.getProvidedComponents();

				return API.v1.success({ externalComponents });
			},
		});

		this.api.addRoute('languages', { authRequired: false }, {
			get() {
				const apps = manager.get().map((prl) => ({
					id: prl.getID(),
					languages: prl.getStorageItem().languageContent,
				}));

				return API.v1.success({ apps });
			},
		});

		this.api.addRoute('externalComponentEvent', { authRequired: true }, {
			post() {
				if (!this.bodyParams.externalComponent || !['IPostExternalComponentOpened', 'IPostExternalComponentClosed'].includes(this.bodyParams.event)) {
					return API.v1.failure({ error: 'Event and externalComponent must be provided.' });
				}

				try {
					const { event, externalComponent } = this.bodyParams;
					const result = Apps.getBridges().getListenerBridge().externalComponentEvent(event, externalComponent);

					return API.v1.success({ result });
				} catch (e) {
					orchestrator.getRocketChatLogger().error(`Error triggering external components' events ${ e.response.data }`);
					return API.v1.internalError();
				}
			},
		});

		this.api.addRoute('bundles/:id/apps', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const baseUrl = orchestrator.getMarketplaceUrl();

				const headers = {};
				const token = getWorkspaceAccessToken();
				if (token) {
					headers.Authorization = `Bearer ${ token }`;
				}

				let result;
				try {
					result = HTTP.get(`${ baseUrl }/v1/bundles/${ this.urlParams.id }/apps`, {
						headers,
					});
				} catch (e) {
					orchestrator.getRocketChatLogger().error('Error getting the Bundle\'s Apps from the Marketplace:', e.response.data);
					return API.v1.internalError();
				}

				if (!result || result.statusCode !== 200 || result.data.length === 0) {
					orchestrator.getRocketChatLogger().error('Error getting the Bundle\'s Apps from the Marketplace:', result.data);
					return API.v1.failure();
				}

				return API.v1.success({ apps: result.data });
			},
		});

		this.api.addRoute(':id', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				if (this.queryParams.marketplace && this.queryParams.version) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = {}; // DO NOT ATTACH THE FRAMEWORK/ENGINE VERSION HERE.
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					let result;
					try {
						result = HTTP.get(`${ baseUrl }/v1/apps/${ this.urlParams.id }?appVersion=${ this.queryParams.version }`, {
							headers,
						});
					} catch (e) {
						return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
					}

					if (!result || result.statusCode !== 200 || result.data.length === 0) {
						orchestrator.getRocketChatLogger().error('Error getting the App information from the Marketplace:', result.data);
						return API.v1.failure();
					}

					return API.v1.success({ app: result.data[0] });
				}

				if (this.queryParams.marketplace && this.queryParams.update && this.queryParams.appVersion) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					let result;
					try {
						result = HTTP.get(`${ baseUrl }/v1/apps/${ this.urlParams.id }/latest?frameworkVersion=${ appsEngineVersionForMarketplace }`, {
							headers,
						});
					} catch (e) {
						return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
					}

					if (result.statusCode !== 200 || result.data.length === 0) {
						orchestrator.getRocketChatLogger().error('Error getting the App update info from the Marketplace:', result.data);
						return API.v1.failure();
					}

					return API.v1.success({ app: result.data });
				}

				const app = manager.getOneById(this.urlParams.id);

				if (!app) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				return API.v1.success({
					app: formatAppInstanceForRest(app),
				});
			},
			post() {
				let buff;
				let permissionsGranted;

				if (this.bodyParams.url) {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Updating an App from a url is disabled.' });
					}

					const result = HTTP.call('GET', this.bodyParams.url, { npmRequestOptions: { encoding: null } });

					if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = result.content;
				} else if (this.bodyParams.appId && this.bodyParams.marketplace && this.bodyParams.version) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken(true, 'marketplace:download', false);

					let result;
					try {
						result = HTTP.get(`${ baseUrl }/v2/apps/${ this.bodyParams.appId }/download/${ this.bodyParams.version }?token=${ token }`, {
							headers,
							npmRequestOptions: { encoding: null },
						});
					} catch (e) {
						orchestrator.getRocketChatLogger().error('Error getting the App from the Marketplace:', e.response.data);
						return API.v1.internalError();
					}

					if (result.statusCode !== 200) {
						orchestrator.getRocketChatLogger().error('Error getting the App from the Marketplace:', result.data);
						return API.v1.failure();
					}

					if (!result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = result.content;
				} else {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Direct updating of an App is disabled.' });
					}

					const formData = Promise.await(getUploadFormData({
						request: this.request,
					}));
					buff = formData?.app?.fileBuffer;
					permissionsGranted = (() => {
						try {
							const permissions = JSON.parse(formData?.permissions || '');
							return permissions.length ? permissions : undefined;
						} catch {
							return undefined;
						}
					})();
				}

				if (!buff) {
					return API.v1.failure({ error: 'Failed to get a file to install for the App. ' });
				}

				const aff = Promise.await(manager.update(buff, permissionsGranted));
				const info = aff.getAppInfo();

				if (aff.hasStorageError()) {
					return API.v1.failure({ status: 'storage_error', messages: [aff.getStorageError()] });
				}

				if (aff.hasAppUserError()) {
					return API.v1.failure({
						status: 'app_user_error',
						messages: [aff.getAppUserError().message],
						payload: { username: aff.getAppUserError().username },
					});
				}

				info.status = aff.getApp().getStatus();

				return API.v1.success({
					app: info,
					implemented: aff.getImplementedInferfaces(),
					licenseValidation: aff.getLicenseValidationResult(),
				});
			},
			delete() {
				const prl = manager.getOneById(this.urlParams.id);

				if (!prl) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const user = orchestrator.getConverters().get('users').convertToApp(Meteor.user());

				Promise.await(manager.remove(prl.getID(), { user }));

				const info = prl.getInfo();
				info.status = prl.getStatus();

				return API.v1.success({ app: info });
			},
		});

		this.api.addRoute(':id/sync', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			post() {
				const baseUrl = orchestrator.getMarketplaceUrl();

				const headers = getDefaultHeaders();
				const token = getWorkspaceAccessToken();
				if (token) {
					headers.Authorization = `Bearer ${ token }`;
				}

				const [workspaceIdSetting] = Settings.findById('Cloud_Workspace_Id').fetch();

				let result;
				try {
					result = HTTP.get(`${ baseUrl }/v1/workspaces/${ workspaceIdSetting.value }/apps/${ this.urlParams.id }`, {
						headers,
					});
				} catch (e) {
					orchestrator.getRocketChatLogger().error('Error syncing the App from the Marketplace:', e.response.data);
					return API.v1.internalError();
				}

				if (result.statusCode !== 200) {
					orchestrator.getRocketChatLogger().error('Error syncing the App from the Marketplace:', result.data);
					return API.v1.failure();
				}

				Promise.await(Apps.updateAppsMarketplaceInfo([result.data]));

				return API.v1.success({ app: result.data });
			},
		});

		this.api.addRoute(':id/icon', { authRequired: false }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);
				if (!prl) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const info = prl.getInfo();
				if (!info || !info.iconFileContent) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const imageData = info.iconFileContent.split(';base64,');

				const buf = Buffer.from(imageData[1], 'base64');

				return {
					statusCode: 200,
					headers: {
						'Content-Length': buf.length,
						'Content-Type': imageData[0].replace('data:', ''),
					},
					body: buf,
				};
			},
		});

		this.api.addRoute(':id/languages', { authRequired: false }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const languages = prl.getStorageItem().languageContent || {};

					return API.v1.success({ languages });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/logs', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const { offset, count } = this.getPaginationItems();
					const { sort, fields, query } = this.parseJsonQuery();

					const ourQuery = Object.assign({}, query, { appId: prl.getID() });
					const options = {
						sort: sort || { _updatedAt: -1 },
						skip: offset,
						limit: count,
						fields,
					};

					const logs = Promise.await(orchestrator.getLogStorage().find(ourQuery, options));

					return API.v1.success({ logs });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/settings', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const settings = Object.assign({}, prl.getStorageItem().settings);

					Object.keys(settings).forEach((k) => {
						if (settings[k].hidden) {
							delete settings[k];
						}
					});

					return API.v1.success({ settings });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
			post() {
				if (!this.bodyParams || !this.bodyParams.settings) {
					return API.v1.failure('The settings to update must be present.');
				}

				const prl = manager.getOneById(this.urlParams.id);

				if (!prl) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const { settings } = prl.getStorageItem();

				const updated = [];
				this.bodyParams.settings.forEach((s) => {
					if (settings[s.id]) {
						Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, s));
						// Updating?
						updated.push(s);
					}
				});

				return API.v1.success({ updated });
			},
		});

		this.api.addRoute(':id/settings/:settingId', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				try {
					const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);

					API.v1.success({ setting });
				} catch (e) {
					if (e.message.includes('No setting found')) {
						return API.v1.notFound(`No Setting found on the App by the id of: "${ this.urlParams.settingId }"`);
					} if (e.message.includes('No App found')) {
						return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
					}
					return API.v1.failure(e.message);
				}
			},
			post() {
				if (!this.bodyParams.setting) {
					return API.v1.failure('Setting to update to must be present on the posted body.');
				}

				try {
					Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting));

					return API.v1.success();
				} catch (e) {
					if (e.message.includes('No setting found')) {
						return API.v1.notFound(`No Setting found on the App by the id of: "${ this.urlParams.settingId }"`);
					} if (e.message.includes('No App found')) {
						return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
					}
					return API.v1.failure(e.message);
				}
			},
		});

		this.api.addRoute(':id/apis', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					return API.v1.success({
						apis: manager.apiManager.listApis(this.urlParams.id),
					});
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/status', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					return API.v1.success({ status: prl.getStatus() });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
			post() {
				if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
					return API.v1.failure('Invalid status provided, it must be "status" field and a string.');
				}

				const prl = manager.getOneById(this.urlParams.id);

				if (!prl) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));

				return API.v1.success({ status: result.getStatus() });
			},
		});
	}
}
