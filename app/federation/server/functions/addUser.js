import { Meteor } from 'meteor/meteor';

import * as federationErrors from './errors';
import { FederationServers, Users } from '../../../models/server';
import { getUserByUsername } from '../handler';

export function addUser(query) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addUser' });
	}

	const user = getUserByUsername(query);

	if (!user) {
		throw federationErrors.userNotFound(query);
	}

	let userId = user._id;

	try {
		// Create the local user
		userId = Users.create(user);

		// Refresh the servers list
		FederationServers.refreshServers();
	} catch (err) {
		// This might get called twice by the createDirectMessage method
		// so we need to handle the situation accordingly
		if (err.code !== 11000) {
			throw err;
		}
	}

	return Users.findOne({ _id: userId });
}
