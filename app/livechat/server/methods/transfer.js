import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, Subscriptions, LivechatVisitors, Users } from '../../../models';
import { Livechat } from '../lib/Livechat';
import { normalizeTransferredByData } from '../lib/Helper';

Meteor.methods({
	'livechat:transfer'(transferData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:transfer' });
		}

		check(transferData, {
			roomId: String,
			userId: Match.Optional(String),
			departmentId: Match.Optional(String),
			comment: Match.Optional(String),
			clientAction: Match.Optional(Boolean),
		});

		const room = LivechatRooms.findOneById(transferData.roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:transfer' });
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:transfer' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription && !hasPermission(Meteor.userId(), 'transfer-livechat-guest')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:transfer' });
		}

		const guest = LivechatVisitors.findOneById(room.v && room.v._id);
		transferData.transferredBy = normalizeTransferredByData(Meteor.user() || {}, room);
		if (transferData.userId) {
			const userToTransfer = Users.findOneById(transferData.userId);
			transferData.transferredTo = { _id: userToTransfer._id, username: userToTransfer.username, name: userToTransfer.name };
		}

		return Livechat.transfer(room, guest, transferData);
	},
});
