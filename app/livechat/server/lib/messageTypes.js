import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { actionLinks } from '../../../action-links/server';
import { Notifications } from '../../../notifications/server';
import { Messages, LivechatRooms } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Livechat } from './Livechat';

actionLinks.register('denyLivechatCall', function(message/* , params*/) {
	const user = Meteor.user();

	Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
	Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });

	const language = user.language || settings.get('Language') || 'en';

	Livechat.closeRoom({
		user,
		room: LivechatRooms.findOneById(message.rid),
		comment: TAPi18n.__('Videocall_declined', { lng: language }),
	});
	Meteor.defer(() => {
		Messages.setHiddenById(message._id);
	});
});
