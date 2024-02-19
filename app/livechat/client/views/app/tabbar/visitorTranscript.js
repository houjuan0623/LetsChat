import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { handleError } from '../../../../../../client/lib/utils/handleError';
import { t, isEmail, roomTypes } from '../../../../../utils';
import { APIClient } from '../../../../../utils/client';
import './visitorTranscript.html';

const validateTranscriptData = (instance) => {
	const subject = instance.$('[name="subject"]').val();
	const email = instance.$('[name="email"]').val();

	if (email === '') {
		instance.errorMessage.set(t('Mail_Message_Missing_to'));
		return false;
	}

	if (!isEmail(email)) {
		instance.errorMessage.set(t('Mail_Message_Invalid_emails', email));
		return false;
	}

	if (subject === '') {
		instance.errorMessage.set(t('Mail_Message_Missing_subject'));
		return false;
	}

	const visitor = instance.visitor.get();
	const { visitorEmails: { 0: visitorEmail } } = visitor;

	if (email !== visitorEmail.address) {
		instance.errorMessage.set(t('Livechat_visitor_email_and_transcript_email_do_not_match'));
		return false;
	}

	return true;
};

Template.visitorTranscript.helpers({
	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},
	email() {
		const room = Template.instance().room.get();
		if (room?.transcriptRequest) {
			return room.transcriptRequest.email;
		}

		const visitor = Template.instance().visitor.get();
		if (visitor?.visitorEmails && visitor.visitorEmails.length > 0) {
			return visitor.visitorEmails[0].address;
		}
	},
	subject() {
		const room = Template.instance().room.get();
		if (room?.transcriptRequest) {
			return room.transcriptRequest.subject;
		}

		return t('Transcript_of_your_livechat_conversation') || (room && roomTypes.getRoomName(room.t, room));
	},
	errorEmail() {
		const instance = Template.instance();
		return instance && instance.erroredEmails.get().join(', ');
	},
	errorMessage() {
		return Template.instance().errorMessage.get();
	},
	infoMessage() {
		return Template.instance().infoMessage.get();
	},
	transcriptRequested() {
		const room = Template.instance().room.get();
		return room?.hasOwnProperty('transcriptRequest');
	},
});

Template.visitorTranscript.events({
	'click .send'(e, instance) {
		event.preventDefault();

		if (!validateTranscriptData(instance)) {
			return;
		}

		const subject = instance.$('[name="subject"]').val();
		const email = instance.$('[name="email"]').val();

		const room = instance.room.get();
		const { _id: rid } = room;

		const visitor = instance.visitor.get();
		const { token } = visitor;

		Meteor.call('livechat:sendTranscript', token, rid, email, subject, (err) => {
			if (err != null) {
				return handleError(err);
			}

			toastr.success(t('Your_email_has_been_queued_for_sending'));
			this.save();
		});
	},

	'click .request'(e, instance) {
		event.preventDefault();

		if (!validateTranscriptData(instance)) {
			return;
		}

		const subject = instance.$('[name="subject"]').val();
		const email = instance.$('[name="email"]').val();

		const room = instance.room.get();
		const { _id: rid } = room;

		Meteor.call('livechat:requestTranscript', rid, email, subject, (err) => {
			if (err != null) {
				return handleError(err);
			}

			toastr.success(t('Livechat_transcript_has_been_requested'));
			this.save();
		});
	},

	'click .discard'(e, instance) {
		event.preventDefault();

		const room = instance.room.get();
		const { _id: rid } = room;

		Meteor.call('livechat:discardTranscript', rid, (err) => {
			if (err != null) {
				return handleError(err);
			}

			toastr.success(t('Livechat_transcript_request_has_been_canceled'));
			this.save();
		});
	},

	'click .cancel'() {
		this.cancel();
	},
});

Template.visitorTranscript.onCreated(async function() {
	this.room = new ReactiveVar();
	this.visitor = new ReactiveVar();
	this.errorMessage = new ReactiveVar('');
	this.infoMessage = new ReactiveVar('');

	this.autorun(async () => {
		const { visitor } = await APIClient.v1.get(`livechat/visitors.info?visitorId=${ Template.currentData().visitorId }`);
		this.visitor.set(visitor);
	});

	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ Template.currentData().roomId }`);
		this.room.set(room);

		if (room?.transcriptRequest) {
			this.infoMessage.set(t('Livechat_transcript_already_requested_warning'));
		}
	});
});
