import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission, hasAllPermission } from '../../../authorization/server';
import { getSettingPermissionId } from '../../../authorization/lib';
import { settings } from '../../../settings';
import { Settings } from '../../../models';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';

Meteor.methods({
	saveSetting: twoFactorRequired(function(_id, value, editor) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}

		if (!hasPermission(uid, 'edit-privileged-setting')
			&& !hasAllPermission(uid, ['manage-selected-settings', getSettingPermissionId(_id)])) { // TODO use the same function
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
				settingId: _id,
			});
		}

		// Verify the _id passed in is a string.
		check(_id, String);

		const setting = Settings.db.findOneById(_id);

		// Verify the value is what it should be
		switch (setting.type) {
			case 'roomPick':
				check(value, Match.OneOf([Object], ''));
				break;
			case 'boolean':
				check(value, Boolean);
				break;
			case 'int':
				check(value, Number);
				break;
			default:
				check(value, String);
				break;
		}

		settings.updateById(_id, value, editor);
		return true;
	}),
});
