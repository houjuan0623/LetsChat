import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings';
import { getRoomRoles } from '../lib/getRoomRoles';


Meteor.methods({
	getRoomRoles(rid) {
		check(rid, String);

		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		check(rid, String);

		return getRoomRoles(rid);
	},
});
