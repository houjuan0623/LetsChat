import get from 'lodash.get';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../app/callbacks/server';
import { Users, LivechatVisitors, Rooms } from '../../../../../app/models/server';
import { IMessage } from '../../../../../definition/IMessage';
import { IOmnichannelRoom, isOmnichannelRoom } from '../../../../../definition/IRoom';

const placeholderFields = {
	'contact.name': {
		from: 'visitor',
		dataKey: 'name',
	},
	'contact.email': {
		from: 'visitor',
		dataKey: 'visitorEmails[0].address',
	},
	'contact.phone': {
		from: 'visitor',
		dataKey: 'phone[0].phoneNumber',
	},
	'agent.name': {
		from: 'agent',
		dataKey: 'name',
	},
	'agent.email': {
		from: 'agent',
		dataKey: 'emails[0].address',
	},
};

const handleBeforeSaveMessage = (message: IMessage, room: IOmnichannelRoom): any => {
	if (!message.msg || message.msg === '') {
		return message;
	}

	room = room?._id ? room : Rooms.findOneById(message.rid);
	if (!isOmnichannelRoom(room)) {
		return message;
	}

	let messageText = message.msg;
	const agentId = room?.servedBy?._id;
	const visitorId = room?.v?._id;
	const agent = Users.findOneById(agentId, { fields: { name: 1, _id: 1, emails: 1 } }) || {};
	const visitor = LivechatVisitors.findOneById(visitorId) || {};

	Object.keys(placeholderFields).map((field) => {
		const templateKey = `{{${ field }}}`;
		const placeholderConfig = placeholderFields[field as keyof typeof placeholderFields];
		const from = placeholderConfig.from === 'agent' ? agent : visitor;
		const data = get(from, placeholderConfig.dataKey, '');
		messageText = messageText.replace(templateKey, data);

		return messageText;
	});

	message.msg = messageText;
	return message;
};

settings.get('Canned_Responses_Enable', function(_, value) {
	if (!value) {
		callbacks.remove('beforeSaveMessage', 'canned-responses-replace-placeholders');
		return;
	}

	callbacks.add('beforeSaveMessage', handleBeforeSaveMessage, callbacks.priority.MEDIUM, 'canned-responses-replace-placeholders');
});
