import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions, Integrations } from '../../../models/server';
import { roomTypes, getValidRoomName } from '../../../utils/server';
import { callbacks } from '../../../callbacks/server';
import { checkUsernameAvailability } from '../../../lib/server/functions';

const updateRoomName = (rid, displayName, isDiscussion) => {
	if (isDiscussion) {
		return Rooms.setFnameById(rid, displayName) && Subscriptions.updateFnameByRoomId(rid, displayName);
	}
	const slugifiedRoomName = getValidRoomName(displayName, rid);

	// Check if the username is available
	if (!checkUsernameAvailability(slugifiedRoomName)) {
		throw new Meteor.Error('error-duplicate-handle', `A room, team or user with name '${ slugifiedRoomName }' already exists`, { function: 'RocketChat.updateRoomName', handle: slugifiedRoomName });
	}

	return Rooms.setNameById(rid, slugifiedRoomName, displayName) && Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);
};

export const saveRoomName = function(rid, displayName, user, sendMessage = true) {
	const room = Rooms.findOneById(rid);
	if (roomTypes.getConfig(room.t).preventRenaming()) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			function: 'RocketChat.saveRoomdisplayName',
		});
	}
	if (displayName === room.name) {
		return;
	}
	const isDiscussion = Boolean(room && room.prid);
	const update = updateRoomName(rid, displayName, isDiscussion);
	if (!update) {
		return;
	}

	Integrations.updateRoomName(room.name, displayName);
	if (sendMessage) {
		Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
	}
	callbacks.run('afterRoomNameChange', { rid, name: displayName, oldName: room.name });
	return displayName;
};
