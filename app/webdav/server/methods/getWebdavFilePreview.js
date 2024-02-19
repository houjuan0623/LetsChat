import { Meteor } from 'meteor/meteor';
import { createClient } from 'webdav';

import { settings } from '../../../settings';
import { getWebdavCredentials } from './getWebdavCredentials';
import { WebdavAccounts } from '../../../models';

Meteor.methods({
	async getWebdavFilePreview(accountId, path) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'getWebdavFilePreview' });
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', { method: 'getWebdavFilePreview' });
		}

		const account = WebdavAccounts.findOne({ _id: accountId, user_id: Meteor.userId() });
		if (!account) {
			throw new Meteor.Error('error-invalid-account', 'Invalid WebDAV Account', { method: 'getWebdavFilePreview' });
		}

		try {
			const cred = getWebdavCredentials(account);
			const client = createClient(account.server_url, cred);
			const serverURL = settings.get('Accounts_OAuth_Nextcloud_URL');
			const res = await client.customRequest({
				url: `${ serverURL }/index.php/core/preview.png?file=${ path }&x=64&y=64`,
				method: 'GET',
				responseType: 'arraybuffer',
			});
			return { success: true, data: res.data };
		} catch (error) {
			// ignore error
		}
	},
});
