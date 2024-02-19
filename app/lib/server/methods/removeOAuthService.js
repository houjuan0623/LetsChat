import { capitalize } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';

Meteor.methods({
	removeOAuthService(name) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'removeOAuthService' });
		}

		if (hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'removeOAuthService' });
		}

		name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
		name = capitalize(name);
		settings.removeById(`Accounts_OAuth_Custom-${ name }`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-url`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-token_path`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-identity_path`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-authorize_path`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-scope`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-access_token_param`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-token_sent_via`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-identity_token_sent_via`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-id`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-secret`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-button_label_text`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-button_label_color`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-button_color`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-login_style`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-key_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-username_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-email_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-name_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-avatar_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-roles_claim`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-merge_roles`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-merge_users`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-show_button`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-groups_claim`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-channels_admin`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-map_channels`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-groups_channel_map`);
	},
});
