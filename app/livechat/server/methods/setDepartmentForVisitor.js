import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { LivechatRooms, Messages, LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';
import { normalizeTransferredByData } from '../lib/Helper';

Meteor.methods({
	'livechat:setDepartmentForVisitor'({ roomId, visitorToken, departmentId } = {}) {
		check(roomId, String);
		check(visitorToken, String);
		check(departmentId, String);

		const room = LivechatRooms.findOneById(roomId);
		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		// update visited page history to not expire
		Messages.keepHistoryForToken(visitorToken);

		const transferData = {
			roomId,
			departmentId,
			transferredBy: normalizeTransferredByData(visitor, room),
		};

		return Livechat.transfer(room, visitor, transferData);
	},
});
