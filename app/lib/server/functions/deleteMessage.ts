import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { Messages, Uploads, Rooms } from '../../../models/server';
import { Notifications } from '../../../notifications/server';
import { callbacks } from '../../../callbacks/server';
import { Apps } from '../../../apps/server';
import { IMessage } from '../../../../definition/IMessage';
import { IUser } from '../../../../definition/IUser';

export const deleteMessage = function(message: IMessage, user: IUser): void {
	const deletedMsg = Messages.findOneById(message._id);
	const isThread = deletedMsg.tcount > 0;
	const keepHistory = settings.get('Message_KeepHistory') || isThread;
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus') || isThread;
	const bridges = Apps && Apps.isLoaded() && Apps.getBridges();

	if (deletedMsg && bridges) {
		const prevent = Promise.await(bridges.getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	if (deletedMsg.tmid) {
		Messages.decreaseReplyCountById(deletedMsg.tmid, -1);
	}

	const files = (message.files || [message.file]).filter(Boolean); // Keep compatibility with old messages

	if (keepHistory) {
		if (showDeletedStatus) {
			Messages.cloneAndSaveAsHistoryById(message._id, user);
		} else {
			Messages.setHiddenById(message._id, true);
		}

		files.forEach((file) => {
			file?._id && Uploads.update(file._id, { $set: { _hidden: true } });
		});
	} else {
		if (!showDeletedStatus) {
			Messages.removeById(message._id);
		}

		files.forEach((file) => {
			file?._id && FileUpload.getStore('Uploads').deleteById(file._id);
		});
	}

	const room = Rooms.findOneById(message.rid, { fields: { lastMessage: 1, prid: 1, mid: 1 } });
	callbacks.run('afterDeleteMessage', deletedMsg, room);

	// update last message
	if (settings.get('Store_Last_Message')) {
		if (!room.lastMessage || room.lastMessage._id === message._id) {
			Rooms.resetLastMessageById(message.rid, message._id);
		}
	}

	// decrease message count
	Rooms.decreaseMessageCountById(message.rid, 1);

	if (showDeletedStatus) {
		Messages.setAsDeletedByIdAndUser(message._id, user);
	} else {
		Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });
	}

	if (bridges) {
		bridges.getListenerBridge().messageEvent('IPostMessageDeleted', deletedMsg);
	}
};
