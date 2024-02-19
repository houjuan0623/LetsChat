import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { FileUpload } from '../../../../file-upload/server';
import { LivechatRooms, LivechatVisitors, LivechatDepartment } from '../../../../models/server';
import { API } from '../../../../api/server';
import { SMS } from '../../../../sms';
import { Livechat } from '../../../server/lib/Livechat';
import { OmnichannelSourceType } from '../../../../../definition/IRoom';

const getUploadFile = (details, fileUrl) => {
	const response = HTTP.get(fileUrl, { npmRequestOptions: { encoding: null } });
	if (response.statusCode !== 200 || !response.content || response.content.length === 0) {
		throw new Meteor.Error('error-invalid-file-uploaded', 'Invalid file uploaded');
	}

	const fileStore = FileUpload.getStore('Uploads');

	const { content, content: { length: size } } = response;
	return fileStore.insertSync({ ...details, size }, content);
};

const defineDepartment = (idOrName) => {
	if (!idOrName || idOrName === '') {
		return;
	}

	const department = LivechatDepartment.findOneByIdOrName(idOrName);
	return department && department._id;
};

const defineVisitor = (smsNumber) => {
	const visitor = LivechatVisitors.findOneVisitorByPhone(smsNumber);
	let data = {
		token: (visitor && visitor.token) || Random.id(),
	};

	if (!visitor) {
		data = Object.assign(data, {
			username: smsNumber.replace(/[^0-9]/g, ''),
			phone: {
				number: smsNumber,
			},
		});
	}

	const department = defineDepartment(SMS.department);
	if (department) {
		data.department = department;
	}

	const id = Livechat.registerGuest(data);
	return LivechatVisitors.findOneById(id);
};

const normalizeLocationSharing = (payload) => {
	const { extra: { fromLatitude: latitude, fromLongitude: longitude } = {} } = payload;
	if (!latitude || !longitude) {
		return;
	}

	return {
		type: 'Point',
		coordinates: [parseFloat(longitude), parseFloat(latitude)],
	};
};

API.v1.addRoute('livechat/sms-incoming/:service', {
	post() {
		const SMSService = SMS.getService(this.urlParams.service);
		const sms = SMSService.parse(this.bodyParams);

		const visitor = defineVisitor(sms.from);
		const { token } = visitor;
		const room = LivechatRooms.findOneOpenByVisitorToken(token);
		const roomExists = !!room;
		const location = normalizeLocationSharing(sms);
		const rid = (room && room._id) || Random.id();

		const sendMessage = {
			guest: visitor,
			roomInfo: {
				sms: {
					from: sms.to,
				},
				source: {
					type: OmnichannelSourceType.SMS,
					alias: this.urlParams.service,
				},
			},
		};

		// create an empty room first place, so attachments have a place to live
		if (!roomExists) {
			Promise.await(Livechat.getRoom(visitor, { rid, token, msg: '' }, sendMessage.roomInfo, undefined));
		}

		let file;
		let attachments;

		const [media] = sms.media;
		if (media) {
			const { url: smsUrl, contentType } = media;
			const details = {
				name: 'Upload File',
				type: contentType,
				rid,
				visitorToken: token,
			};

			let attachment;
			try {
				const uploadedFile = getUploadFile(details, smsUrl);
				file = { _id: uploadedFile._id, name: uploadedFile.name, type: uploadedFile.type };
				const fileUrl = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);

				attachment = {
					title: file.name,
					type: 'file',
					description: file.description,
					title_link: fileUrl,
				};

				if (/^image\/.+/.test(file.type)) {
					attachment.image_url = fileUrl;
					attachment.image_type = file.type;
					attachment.image_size = file.size;
					attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
				} else if (/^audio\/.+/.test(file.type)) {
					attachment.audio_url = fileUrl;
					attachment.audio_type = file.type;
					attachment.audio_size = file.size;
				} else if (/^video\/.+/.test(file.type)) {
					attachment.video_url = fileUrl;
					attachment.video_type = file.type;
					attachment.video_size = file.size;
				}
			} catch (e) {
				Livechat.logger.error(`Attachment upload failed: ${ e.message }`);
				attachment = {
					fields: [{
						title: 'User upload failed',
						value: 'An attachment was received, but upload to server failed',
						short: true,
					}],
					color: 'yellow',
				};
			}
			attachments = [attachment];
		}

		sendMessage.message = {
			_id: Random.id(),
			rid,
			token,
			msg: sms.body,
			...location && { location },
			...attachments && { attachments },
			...file && { file },
		};

		try {
			const msg = SMSService.response.call(this, Promise.await(Livechat.sendMessage(sendMessage)));
			Meteor.defer(() => {
				if (sms.extra) {
					if (sms.extra.fromCountry) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
					}
					if (sms.extra.fromState) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
					}
					if (sms.extra.fromCity) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
					}
				}
			});

			return msg;
		} catch (e) {
			return SMSService.error.call(this, e);
		}
	},
});
