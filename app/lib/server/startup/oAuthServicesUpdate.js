import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { CustomOAuth } from '../../../custom-oauth';
import { Logger } from '../../../logger';
import { settings } from '../../../settings';
import { addOAuthService } from '../functions/addOAuthService';

const logger = new Logger('rocketchat:lib');

function _OAuthServicesUpdate() {
	const services = settings.get(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i);
	services.forEach((service) => {
		logger.info({ oauth_updated: service.key });
		let serviceName = service.key.replace('Accounts_OAuth_', '');
		if (serviceName === 'Meteor') {
			serviceName = 'meteor-developer';
		}
		if (/Accounts_OAuth_Custom-/.test(service.key)) {
			serviceName = service.key.replace('Accounts_OAuth_Custom-', '');
		}

		if (service.value === true) {
			const data = {
				clientId: settings.get(`${ service.key }_id`),
				secret: settings.get(`${ service.key }_secret`),
			};

			if (/Accounts_OAuth_Custom-/.test(service.key)) {
				data.custom = true;
				data.clientId = settings.get(`${ service.key }-id`);
				data.secret = settings.get(`${ service.key }-secret`);
				data.serverURL = settings.get(`${ service.key }-url`);
				data.tokenPath = settings.get(`${ service.key }-token_path`);
				data.identityPath = settings.get(`${ service.key }-identity_path`);
				data.authorizePath = settings.get(`${ service.key }-authorize_path`);
				data.scope = settings.get(`${ service.key }-scope`);
				data.accessTokenParam = settings.get(`${ service.key }-access_token_param`);
				data.buttonLabelText = settings.get(`${ service.key }-button_label_text`);
				data.buttonLabelColor = settings.get(`${ service.key }-button_label_color`);
				data.loginStyle = settings.get(`${ service.key }-login_style`);
				data.buttonColor = settings.get(`${ service.key }-button_color`);
				data.tokenSentVia = settings.get(`${ service.key }-token_sent_via`);
				data.identityTokenSentVia = settings.get(`${ service.key }-identity_token_sent_via`);
				data.keyField = settings.get(`${ service.key }-key_field`);
				data.usernameField = settings.get(`${ service.key }-username_field`);
				data.emailField = settings.get(`${ service.key }-email_field`);
				data.nameField = settings.get(`${ service.key }-name_field`);
				data.avatarField = settings.get(`${ service.key }-avatar_field`);
				data.rolesClaim = settings.get(`${ service.key }-roles_claim`);
				data.groupsClaim = settings.get(`${ service.key }-groups_claim`);
				data.channelsMap = settings.get(`${ service.key }-groups_channel_map`);
				data.channelsAdmin = settings.get(`${ service.key }-channels_admin`);
				data.mergeUsers = settings.get(`${ service.key }-merge_users`);
				data.mapChannels = settings.get(`${ service.key }-map_channels`);
				data.mergeRoles = settings.get(`${ service.key }-merge_roles`);
				data.showButton = settings.get(`${ service.key }-show_button`);

				new CustomOAuth(serviceName.toLowerCase(), {
					serverURL: data.serverURL,
					tokenPath: data.tokenPath,
					identityPath: data.identityPath,
					authorizePath: data.authorizePath,
					scope: data.scope,
					loginStyle: data.loginStyle,
					tokenSentVia: data.tokenSentVia,
					identityTokenSentVia: data.identityTokenSentVia,
					keyField: data.keyField,
					usernameField: data.usernameField,
					emailField: data.emailField,
					nameField: data.nameField,
					avatarField: data.avatarField,
					rolesClaim: data.rolesClaim,
					groupsClaim: data.groupsClaim,
					mapChannels: data.mapChannels,
					channelsMap: data.channelsMap,
					channelsAdmin: data.channelsAdmin,
					mergeUsers: data.mergeUsers,
					mergeRoles: data.mergeRoles,
					accessTokenParam: data.accessTokenParam,
					showButton: data.showButton,
				});
			}
			if (serviceName === 'Facebook') {
				data.appId = data.clientId;
				delete data.clientId;
			}
			if (serviceName === 'Twitter') {
				data.consumerKey = data.clientId;
				delete data.clientId;
			}

			if (serviceName === 'Linkedin') {
				data.clientConfig = {
					requestPermissions: ['r_liteprofile', 'r_emailaddress'],
				};
			}

			if (serviceName === 'Nextcloud') {
				data.buttonLabelText = settings.get('Accounts_OAuth_Nextcloud_button_label_text');
				data.buttonLabelColor = settings.get('Accounts_OAuth_Nextcloud_button_label_color');
				data.buttonColor = settings.get('Accounts_OAuth_Nextcloud_button_color');
			}

			// If there's no data other than the service name, then put the service name in the data object so the operation won't fail
			const keys = Object.keys(data).filter((key) => data[key] !== undefined);
			if (!keys.length) {
				data.service = serviceName.toLowerCase();
			}

			ServiceConfiguration.configurations.upsert({
				service: serviceName.toLowerCase(),
			}, {
				$set: data,
			});
		} else {
			ServiceConfiguration.configurations.remove({
				service: serviceName.toLowerCase(),
			});
		}
	});
}

const OAuthServicesUpdate = _.debounce(Meteor.bindEnvironment(_OAuthServicesUpdate), 2000);

function OAuthServicesRemove(_id) {
	const serviceName = _id.replace('Accounts_OAuth_Custom-', '');
	return ServiceConfiguration.configurations.remove({
		service: serviceName.toLowerCase(),
	});
}

settings.get(/^Accounts_OAuth_.+/, function() {
	return OAuthServicesUpdate(); // eslint-disable-line new-cap
});

settings.get(/^Accounts_OAuth_Custom-[a-z0-9_]+/, function(key, value) {
	if (!value) {
		return OAuthServicesRemove(key);// eslint-disable-line new-cap
	}
});

function customOAuthServicesInit() {
	// Add settings for custom OAuth providers to the settings so they get
	// automatically added when they are defined in ENV variables
	Object.keys(process.env).forEach((key) => {
		if (/Accounts_OAuth_Custom_[a-zA-Z0-9_-]+$/.test(key)) {
			// Most all shells actually prohibit the usage of - in environment variables
			// So this will allow replacing - with _ and translate it back to the setting name
			let name = key.replace('Accounts_OAuth_Custom_', '');

			if (name.indexOf('_') > -1) {
				name = name.replace(name.substr(name.indexOf('_')), '');
			}

			const serviceKey = `Accounts_OAuth_Custom_${ name }`;

			if (key === serviceKey) {
				const values = {
					enabled: process.env[`${ serviceKey }`] === 'true',
					clientId: process.env[`${ serviceKey }_id`],
					clientSecret: process.env[`${ serviceKey }_secret`],
					serverURL: process.env[`${ serviceKey }_url`],
					tokenPath: process.env[`${ serviceKey }_token_path`],
					identityPath: process.env[`${ serviceKey }_identity_path`],
					authorizePath: process.env[`${ serviceKey }_authorize_path`],
					scope: process.env[`${ serviceKey }_scope`],
					accessTokenParam: process.env[`${ serviceKey }_access_token_param`],
					buttonLabelText: process.env[`${ serviceKey }_button_label_text`],
					buttonLabelColor: process.env[`${ serviceKey }_button_label_color`],
					loginStyle: process.env[`${ serviceKey }_login_style`],
					buttonColor: process.env[`${ serviceKey }_button_color`],
					tokenSentVia: process.env[`${ serviceKey }_token_sent_via`],
					identityTokenSentVia: process.env[`${ serviceKey }_identity_token_sent_via`],
					keyField: process.env[`${ serviceKey }_key_field`],
					usernameField: process.env[`${ serviceKey }_username_field`],
					nameField: process.env[`${ serviceKey }_name_field`],
					emailField: process.env[`${ serviceKey }_email_field`],
					rolesClaim: process.env[`${ serviceKey }_roles_claim`],
					groupsClaim: process.env[`${ serviceKey }_groups_claim`],
					channelsMap: process.env[`${ serviceKey }_groups_channel_map`],
					channelsAdmin: process.env[`${ serviceKey }_channels_admin`],
					mergeUsers: process.env[`${ serviceKey }_merge_users`] === 'true',
					mapChannels: process.env[`${ serviceKey }_map_channels`],
					mergeRoles: process.env[`${ serviceKey }_merge_roles`] === 'true',
					showButton: process.env[`${ serviceKey }_show_button`] === 'true',
					avatarField: process.env[`${ serviceKey }_avatar_field`],
				};

				addOAuthService(name, values);
			}
		}
	});
}

customOAuthServicesInit();
