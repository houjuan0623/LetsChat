import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { MessageAction, RoomHistoryManager } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { Rooms } from '../../models/client';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'jump-to-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['mentions', 'threads'],
		action(e) {
			e.preventDefault();
			e.stopPropagation();
			const { msg: message } = messageArgs(this);
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			if (message.tmid) {
				return FlowRouter.go(FlowRouter.getRouteName(), {
					tab: 'thread',
					context: message.tmid,
					rid: message.rid,
					name: Rooms.findOne({ _id: message.rid }).name,
				}, {
					jump: message._id,
				});
			}
			RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		order: 100,
		group: ['message', 'menu'],
	});
});
