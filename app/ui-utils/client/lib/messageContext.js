import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

import { Subscriptions, Rooms, Users } from '../../../models/client';
import { hasPermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';
import { getUserPreference, roomTypes } from '../../../utils/client';
import { AutoTranslate } from '../../../autotranslate/client';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { actionLinks } from '../../../action-links/client';
import { goToRoomById } from '../../../../client/lib/utils/goToRoomById';
import { isLayoutEmbedded } from '../../../../client/lib/utils/isLayoutEmbedded';
import { handleError } from '../../../../client/lib/utils/handleError';

const fields = { name: 1, username: 1, 'settings.preferences.enableMessageParserEarlyAdoption': 1, 'settings.preferences.showMessageInMainThread': 1, 'settings.preferences.autoImageLoad': 1, 'settings.preferences.saveMobileBandwidth': 1, 'settings.preferences.collapseMediaByDefault': 1, 'settings.preferences.hideRoles': 1 };

export function messageContext({ rid } = Template.instance()) {
	const uid = Meteor.userId();
	const user = Users.findOne({ _id: uid }, { fields }) || {};
	const instance = Template.instance();
	const openThread = (e) => {
		const { rid, mid, tmid } = e.currentTarget.dataset;
		const room = Rooms.findOne({ _id: rid });
		FlowRouter.go(FlowRouter.getRouteName(), {
			rid,
			name: room.name,
			tab: 'thread',
			context: tmid || mid,
		}, {
			jump: tmid && tmid !== mid && mid && mid,
		});
		e.preventDefault();
		e.stopPropagation();
	};

	const runAction = isLayoutEmbedded() ? (msg, e) => {
		const { actionlink } = e.currentTarget.dataset;
		return fireGlobalEvent('click-action-link', {
			actionlink,
			value: msg._id,
			message: msg,
		});
	} : (msg, e) => {
		const { actionlink } = e.currentTarget.dataset;
		actionLinks.run(actionlink, msg._id, instance, (err) => {
			if (err) {
				handleError(err);
			}
		});
	};

	const openDiscussion = (e) => {
		e.preventDefault();
		e.stopPropagation();
		const { drid } = e.currentTarget.dataset;
		goToRoomById(drid);
	};

	const replyBroadcast = (e) => {
		const { username, mid } = e.currentTarget.dataset;
		roomTypes.openRouteLink('d', { name: username }, { ...FlowRouter.current().queryParams, reply: mid });
	};

	return {
		u: user,
		room: Tracker.nonreactive(() => Rooms.findOne({ _id: rid }, {
			fields: {
				_updatedAt: 0,
				lastMessage: 0,
			},
		})),
		subscription: Subscriptions.findOne({ rid }, {
			fields: {
				name: 1,
				autoTranslate: 1,
				rid: 1,
				tunread: 1,
				tunreadUser: 1,
				tunreadGroup: 1,
			},
		}),
		actions: {
			openThread() {
				return openThread;
			},
			runAction(msg) {
				return () => (e) => {
					e.preventDefault();
					e.stopPropagation();
					runAction(msg, e);
				};
			},
			openDiscussion() {
				return openDiscussion;
			},
			replyBroadcast() {
				return replyBroadcast;
			},
		},
		settings: {
			translateLanguage: AutoTranslate.getLanguage(rid),
			showMessageInMainThread: getUserPreference(user, 'showMessageInMainThread'),
			autoImageLoad: getUserPreference(user, 'autoImageLoad'),
			enableMessageParserEarlyAdoption: getUserPreference(user, 'enableMessageParserEarlyAdoption'),
			saveMobileBandwidth: Meteor.Device.isPhone() && getUserPreference(user, 'saveMobileBandwidth'),
			collapseMediaByDefault: getUserPreference(user, 'collapseMediaByDefault'),
			showreply: true,
			showReplyButton: true,
			hasPermissionDeleteMessage: hasPermission('delete-message', rid),
			hasPermissionDeleteOwnMessage: hasPermission('delete-own-message'),
			hideRoles: !settings.get('UI_DisplayRoles') || getUserPreference(user, 'hideRoles'),
			UI_Use_Real_Name: settings.get('UI_Use_Real_Name'),
			Chatops_Username: settings.get('Chatops_Username'),
			AutoTranslate_Enabled: settings.get('AutoTranslate_Enabled'),
			Message_AllowEditing: settings.get('Message_AllowEditing'),
			Message_AllowEditing_BlockEditInMinutes: settings.get('Message_AllowEditing_BlockEditInMinutes'),
			Message_ShowEditedStatus: settings.get('Message_ShowEditedStatus'),
			API_Embed: settings.get('API_Embed'),
			API_EmbedDisabledFor: settings.get('API_EmbedDisabledFor'),
			Message_GroupingPeriod: settings.get('Message_GroupingPeriod') * 1000,
		},
	};
}
