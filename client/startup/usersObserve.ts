import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { RoomManager } from '../../app/ui-utils/client';
import { IUser } from '../../definition/IUser';

Meteor.startup(() => {
	Meteor.users
		.find(
			{},
			{
				fields: {
					name: 1,
					username: 1,
					status: 1,
					utcOffset: 1,
					statusText: 1,
				},
			},
		)
		.observe({
			added(user: IUser) {
				Session.set(`user_${user.username}_status`, user.status);
				Session.set(`user_${user.username}_status_text`, user.statusText);
				RoomManager.updateUserStatus(user, user.status, user.utcOffset);
			},
			changed(user: IUser) {
				Session.set(`user_${user.username}_status`, user.status);
				if (user.statusText !== undefined) {
					Session.set(`user_${user.username}_status_text`, user.statusText);
				}
				RoomManager.updateUserStatus(user, user.status, user.utcOffset);
			},
			removed(user) {
				Session.set(`user_${user.username}_status`, null);
				Session.set(`user_${user.username}_status_text`, null);
				RoomManager.updateUserStatus(user, 'offline', null);
			},
		});
});
