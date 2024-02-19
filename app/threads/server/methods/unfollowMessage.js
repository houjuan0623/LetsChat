import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages } from '../../../models/server';
import { RateLimiter } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { canAccessRoom } from '../../../authorization/server';
import { unfollow } from '../functions';

Meteor.methods({
	'unfollowMessage'({ mid }) {
		check(mid, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unfollowMessage' });
		}

		if (mid && !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'unfollowMessage' });
		}

		const message = Messages.findOneById(mid, { fields: { rid: 1, tmid: 1 } });
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'unfollowMessage' });
		}

		if (!canAccessRoom({ _id: message.rid }, { _id: uid })) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'unfollowMessage' });
		}

		return unfollow({ rid: message.rid, tmid: message.tmid || message._id, uid });
	},
});

RateLimiter.limitMethod('unfollowMessage', 5, 5000, {
	userId() { return true; },
});
