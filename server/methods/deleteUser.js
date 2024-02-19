import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users } from '../../app/models';
import { hasPermission } from '../../app/authorization';
import { callbacks } from '../../app/callbacks/server';
import { deleteUser } from '../../app/lib/server';

Meteor.methods({
	deleteUser(userId, confirmRelinquish = false) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

		if (hasPermission(Meteor.userId(), 'delete-user') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

		const user = Users.findOneById(userId);
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user to delete', {
				method: 'deleteUser',
			});
		}

		if (user.type === 'app') {
			throw new Meteor.Error('error-cannot-delete-app-user', 'Deleting app user is not allowed', {
				method: 'deleteUser',
			});
		}

		const adminCount = Meteor.users.find({ roles: 'admin' }).count();

		const userIsAdmin = user.roles?.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteUser',
				action: 'Remove_last_admin',
			});
		}

		deleteUser(userId, confirmRelinquish);

		callbacks.run('afterDeleteUser', user);

		return true;
	},
});
