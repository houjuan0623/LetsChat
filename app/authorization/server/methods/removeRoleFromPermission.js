import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models/server';
import { hasPermission } from '../functions/hasPermission';
import { CONSTANTS } from '../../lib';

Meteor.methods({
	'authorization:removeRoleFromPermission'(permissionId, role) {
		const uid = Meteor.userId();
		const permission = Permissions.findOneById(permissionId);

		if (!uid || !hasPermission(uid, 'access-permissions') || (permission.level === CONSTANTS.SETTINGS_LEVEL && !hasPermission(uid, 'access-setting-permissions'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Removing permission is not allowed', {
				method: 'authorization:removeRoleFromPermission',
				action: 'Removing_permission',
			});
		}

		// for setting based permissions, revoke the group permission once all setting permissions
		// related to this group have been removed

		if (permission.groupPermissionId) {
			Permissions.removeRole(permission.groupPermissionId, role);
		}
		Permissions.removeRole(permission._id, role);
	},
});
