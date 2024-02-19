import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { e2e } from '../../app/e2e/client/rocketchat.e2e';
import { Subscriptions, Rooms } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { promises } from '../../app/promises/client';
import { settings } from '../../app/settings/client';
import { IMessage } from '../../definition/IMessage';
import { IRoom } from '../../definition/IRoom';
import { ISubscription } from '../../definition/ISubscription';
import { isLayoutEmbedded } from '../lib/utils/isLayoutEmbedded';
import { waitUntilFind } from '../lib/utils/waitUntilFind';

const handle = async (roomId: IRoom['_id'], keyId: string): Promise<void> => {
	const e2eRoom = await e2e.getInstanceByRoomId(roomId);
	if (!e2eRoom) {
		return;
	}

	e2eRoom.provideKeyToUser(keyId);
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		const adminEmbedded = isLayoutEmbedded() && FlowRouter.current().path.startsWith('/admin');

		if (!adminEmbedded && settings.get('E2E_Enable') && window.crypto) {
			e2e.startClient();
			e2e.enabled.set(true);
		} else {
			e2e.enabled.set(false);
			e2e.closeAlert();
		}
	});

	let observable: Meteor.LiveQueryHandle | null = null;
	Tracker.autorun(() => {
		if (!e2e.isReady()) {
			promises.remove('onClientMessageReceived', 'e2e-decript-message');
			Notifications.unUser('e2ekeyRequest', handle);
			observable?.stop();
			return promises.remove('onClientBeforeSendMessage', 'e2e');
		}

		Notifications.onUser('e2ekeyRequest', handle);

		observable = Subscriptions.find().observe({
			changed: async (doc: ISubscription) => {
				if (!doc.encrypted && !doc.E2EKey) {
					e2e.removeInstanceByRoomId(doc.rid);
					return;
				}

				const e2eRoom = await e2e.getInstanceByRoomId(doc.rid);
				if (!e2eRoom) {
					return;
				}

				doc.encrypted ? e2eRoom.resume() : e2eRoom.pause();

				// Cover private groups and direct messages
				if (!e2eRoom.isSupportedRoomType(doc.t)) {
					e2eRoom.disable();
					return;
				}

				if (doc.E2EKey && e2eRoom.isWaitingKeys()) {
					e2eRoom.keyReceived();
					return;
				}

				if (!e2eRoom.isReady()) {
					return;
				}

				e2eRoom.decryptSubscription();
			},
			added: async (doc: ISubscription) => {
				if (!doc.encrypted && !doc.E2EKey) {
					return;
				}
				return e2e.getInstanceByRoomId(doc.rid);
			},
			removed: (doc: ISubscription) => {
				e2e.removeInstanceByRoomId(doc.rid);
			},
		});

		promises.add(
			'onClientMessageReceived',
			async (msg: IMessage) => {
				const e2eRoom = await e2e.getInstanceByRoomId(msg.rid);
				if (!e2eRoom || !e2eRoom.shouldConvertReceivedMessages()) {
					return msg;
				}
				return e2e.decryptMessage(msg);
			},
			promises.priority.HIGH,
			'e2e-decript-message',
		);

		// Encrypt messages before sending
		promises.add(
			'onClientBeforeSendMessage',
			async (message: IMessage) => {
				const e2eRoom = await e2e.getInstanceByRoomId(message.rid);

				if (!e2eRoom) {
					return message;
				}

				const subscription = await waitUntilFind(() => Rooms.findOne({ _id: message.rid }));

				subscription.encrypted ? e2eRoom.resume() : e2eRoom.pause();

				if (!(await e2eRoom.shouldConvertSentMessages())) {
					return message;
				}

				// Should encrypt this message.
				const msg = await e2eRoom.encrypt(message);

				message.msg = msg;
				message.t = 'e2e';
				message.e2e = 'pending';
				return message;
			},
			promises.priority.HIGH,
			'e2e',
		);
	});
});
