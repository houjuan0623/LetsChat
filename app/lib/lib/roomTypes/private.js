import { Meteor } from 'meteor/meteor';

import { ChatRoom, ChatSubscription } from '../../../models';
import { openRoom } from '../../../ui-utils';
import { settings } from '../../../settings';
import { hasAtLeastOnePermission, hasPermission } from '../../../authorization';
import { getUserPreference, RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext, RoomMemberActions } from '../../../utils';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';


export class PrivateRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'group',
			path: '/group/:name/:tab?/:context?',
		});
	}

	action(params) {
		return openRoom('p', params.name);
	}
}

export class PrivateRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'p',
			order: 40,
			icon: 'hashtag-lock',
			label: 'Private_Groups',
			route: new PrivateRoomRoute(),
		});
	}

	getIcon(roomData) {
		if (roomData.prid) {
			return 'discussion';
		}
		if (roomData.teamMain) {
			return 'team-lock';
		}
		return this.icon;
	}

	findRoom(identifier) {
		const query = {
			t: 'p',
			name: identifier,
		};

		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		if (roomData.prid) {
			return roomData.fname;
		}
		if (settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}

		return roomData.name;
	}

	condition() {
		const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && hasPermission('view-p-room');
	}

	isGroupChat() {
		return true;
	}

	canAddUser(room) {
		return hasAtLeastOnePermission(['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);
	}

	canSendMessage(roomId) {
		// TODO: remove duplicated code
		return ChatSubscription.find({
			rid: roomId,
		}).count() > 0;
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			case RoomSettingsEnum.BROADCAST:
				return room.broadcast;
			case RoomSettingsEnum.READ_ONLY:
				return !room.broadcast;
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return !room.broadcast && room.ro;
			case RoomSettingsEnum.E2E:
				return settings.get('E2E_Enable') === true;
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			default:
				return true;
		}
	}

	allowMemberAction(room, action) {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return false;
			default:
				return true;
		}
	}

	enableMembersListProfile() {
		return true;
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Group_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Group_Warning';
			default:
				return '';
		}
	}

	getAvatarPath(roomData) {
		return getAvatarURL({ roomId: roomData._id, cache: roomData.avatarETag });
	}

	includeInDashboard() {
		return true;
	}
}
