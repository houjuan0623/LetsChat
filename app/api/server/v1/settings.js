import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { Settings } from '../../../models/server';
import { hasPermission } from '../../../authorization';
import { API } from '../api';
import { SettingsEvents, settings } from '../../../settings/server';
import { setValue } from '../../../settings/server/raw';

const fetchSettings = (query, sort, offset, count, fields) => {
	const settings = Settings.find(query, {
		sort: sort || { _id: 1 },
		skip: offset,
		limit: count,
		fields: Object.assign({ _id: 1, value: 1, enterprise: 1, invalidValue: 1, modules: 1 }, fields),
	}).fetch();

	SettingsEvents.emit('fetch-settings', settings);
	return settings;
};

// settings endpoints
API.v1.addRoute('settings.public', { authRequired: false }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let ourQuery = {
			hidden: { $ne: true },
			public: true,
		};

		ourQuery = Object.assign({}, query, ourQuery);

		const settings = fetchSettings(ourQuery, sort, offset, count, fields);

		return API.v1.success({
			settings,
			count: settings.length,
			offset,
			total: Settings.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('settings.oauth', { authRequired: false }, {
	get() {
		const mountOAuthServices = () => {
			const oAuthServicesEnabled = ServiceConfiguration.configurations.find({}, { fields: { secret: 0 } }).fetch();

			return oAuthServicesEnabled.map((service) => {
				if (service.custom || ['saml', 'cas', 'wordpress'].includes(service.service)) {
					return { ...service };
				}

				return {
					_id: service._id,
					name: service.service,
					clientId: service.appId || service.clientId || service.consumerKey,
					buttonLabelText: service.buttonLabelText || '',
					buttonColor: service.buttonColor || '',
					buttonLabelColor: service.buttonLabelColor || '',
					custom: false,
				};
			});
		};

		return API.v1.success({
			services: mountOAuthServices(),
		});
	},
});

API.v1.addRoute('settings.addCustomOAuth', { authRequired: true, twoFactorRequired: true }, {
	post() {
		if (!this.requestParams().name || !this.requestParams().name.trim()) {
			throw new Meteor.Error('error-name-param-not-provided', 'The parameter "name" is required');
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addOAuthService', this.requestParams().name, this.userId);
		});


		return API.v1.success();
	},
});

API.v1.addRoute('settings', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let ourQuery = {
			hidden: { $ne: true },
		};

		if (!hasPermission(this.userId, 'view-privileged-setting')) {
			ourQuery.public = true;
		}

		ourQuery = Object.assign({}, query, ourQuery);

		const settings = fetchSettings(ourQuery, sort, offset, count, fields);

		return API.v1.success({
			settings,
			count: settings.length,
			offset,
			total: Settings.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('settings/:_id', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-privileged-setting')) {
			return API.v1.unauthorized();
		}

		return API.v1.success(_.pick(Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value'));
	},
	post: {
		twoFactorRequired: true,
		action() {
			if (!hasPermission(this.userId, 'edit-privileged-setting')) {
				return API.v1.unauthorized();
			}

			// allow special handling of particular setting types
			const setting = Settings.findOneNotHiddenById(this.urlParams._id);
			if (setting.type === 'action' && this.bodyParams && this.bodyParams.execute) {
				// execute the configured method
				Meteor.call(setting.value);
				return API.v1.success();
			}

			if (setting.type === 'color' && this.bodyParams && this.bodyParams.editor && this.bodyParams.value) {
				Settings.updateOptionsById(this.urlParams._id, { editor: this.bodyParams.editor });
				Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value);
				return API.v1.success();
			}

			check(this.bodyParams, {
				value: Match.Any,
			});
			if (Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value)) {
				settings.storeSettingValue({
					_id: this.urlParams._id,
					value: this.bodyParams.value,
				});
				setValue(this.urlParams._id, this.bodyParams.value);
				return API.v1.success();
			}

			return API.v1.failure();
		},
	},
});

API.v1.addRoute('service.configurations', { authRequired: false }, {
	get() {
		return API.v1.success({
			configurations: ServiceConfiguration.configurations.find({}, { fields: { secret: 0 } }).fetch(),
		});
	},
});
