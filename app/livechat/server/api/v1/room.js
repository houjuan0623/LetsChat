import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings as rcSettings } from '../../../../settings';
import { Messages, LivechatRooms } from '../../../../models';
import { API } from '../../../../api/server';
import { findGuest, findRoom, getRoom, settings, findAgent, onCheckRoomParams } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { normalizeTransferredByData } from '../../lib/Helper';
import { findVisitorInfo } from '../lib/visitors';
import { OmnichannelSourceType } from '../../../../../definition/IRoom';

API.v1.addRoute('livechat/room', {
	get() {
		const defaultCheckParams = {
			token: String,
			rid: Match.Maybe(String),
			agentId: Match.Maybe(String),
		};

		const extraCheckParams = onCheckRoomParams(defaultCheckParams);

		check(this.queryParams, extraCheckParams);

		const { token, rid: roomId, agentId, ...extraParams } = this.queryParams;

		const guest = findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		let room;
		if (!roomId) {
			room = LivechatRooms.findOneOpenByVisitorToken(token, {});
			if (room) {
				return API.v1.success({ room, newRoom: false });
			}

			let agent;
			const agentObj = agentId && findAgent(agentId);
			if (agentObj) {
				const { username } = agentObj;
				agent = { agentId, username };
			}

			const rid = Random.id();
			const roomInfo = {
				source: {
					type: this.isWidget() ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
				},
			};

			room = Promise.await(getRoom({ guest, rid, agent, roomInfo, extraParams }));
			return API.v1.success(room);
		}

		room = LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, token, {});
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		return API.v1.success({ room, newRoom: false });
	},
});

API.v1.addRoute('livechat/room.close', {
	post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
			});

			const { rid, token } = this.bodyParams;

			const visitor = findGuest(token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			if (!room.open) {
				throw new Meteor.Error('room-closed');
			}

			const language = rcSettings.get('Language') || 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });

			if (!Livechat.closeRoom({ visitor, room, comment })) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, comment });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.transfer', {
	post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
				department: String,
			});

			const { rid, token, department } = this.bodyParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			let room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			// update visited page history to not expire
			Messages.keepHistoryForToken(token);

			const { _id, username, name } = guest;
			const transferredBy = normalizeTransferredByData({ _id, username, name, userType: 'visitor' }, room);

			if (!Promise.await(Livechat.transfer(room, guest, { roomId: rid, departmentId: department, transferredBy }))) {
				return API.v1.failure();
			}

			room = findRoom(token, rid);
			return API.v1.success({ room });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.survey', {
	post() {
		try {
			check(this.bodyParams, {
				rid: String,
				token: String,
				data: [Match.ObjectIncluding({
					name: String,
					value: String,
				})],
			});

			const { rid, token, data } = this.bodyParams;

			const visitor = findGuest(token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const config = settings();
			if (!config.survey || !config.survey.items || !config.survey.values) {
				throw new Meteor.Error('invalid-livechat-config');
			}

			const updateData = {};
			for (const item of data) {
				if ((config.survey.items.includes(item.name) && config.survey.values.includes(item.value)) || item.name === 'additionalFeedback') {
					updateData[item.name] = item.value;
				}
			}

			if (Object.keys(updateData).length === 0) {
				throw new Meteor.Error('invalid-data');
			}

			if (!LivechatRooms.updateSurveyFeedbackById(room._id, updateData)) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, data: updateData });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/room.forward', { authRequired: true }, {
	post() {
		API.v1.success(Meteor.runAsUser(this.userId, () => Meteor.call('livechat:transfer', this.bodyParams)));
	},
});

API.v1.addRoute('livechat/room.visitor', { authRequired: true }, {
	put() {
		try {
			check(this.bodyParams, {
				rid: String,
				oldVisitorId: String,
				newVisitorId: String,
			});

			const { rid, newVisitorId, oldVisitorId } = this.bodyParams;

			const { visitor } = Promise.await(findVisitorInfo({ userId: this.userId, visitorId: newVisitorId }));
			if (!visitor) {
				throw new Meteor.Error('invalid-visitor');
			}

			let room = LivechatRooms.findOneById(rid, { _id: 1 }); // TODO: check _id
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const { v: { _id: roomVisitorId } = {} } = room; // TODO: v it will be undefined
			if (roomVisitorId !== oldVisitorId) {
				throw new Meteor.Error('invalid-room-visitor');
			}

			room = Livechat.changeRoomVisitor(this.userId, rid, visitor);

			return API.v1.success({ room });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
