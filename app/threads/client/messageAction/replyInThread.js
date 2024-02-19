import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { settings } from '../../../settings/client';
import { MessageAction } from '../../../ui-utils/client';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
import { roomTypes } from '../../../utils/client';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Threads_enabled')) {
			return MessageAction.removeButton('reply-in-thread');
		}
		MessageAction.addButton({
			id: 'reply-in-thread',
			icon: 'thread',
			label: 'Reply_in_thread',
			context: ['message', 'message-mobile'],
			action(e) {
				const { msg: message } = messageArgs(this);
				e.stopPropagation();
				FlowRouter.setParams({
					tab: 'thread',
					context: message.tmid || message._id,
				});
			},
			condition({ subscription, room }) {
				const isLivechatRoom = roomTypes.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}
				return Boolean(subscription);
			},
			order: -1,
			group: ['message', 'menu'],
		});
	});
});
