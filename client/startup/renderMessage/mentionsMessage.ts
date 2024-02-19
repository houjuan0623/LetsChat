import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks/client';
import { Users } from '../../../app/models/client';
import { settings } from '../../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const uid = Meteor.userId();
		const options = {
			me: uid && (Users.findOne(uid, { fields: { username: 1 } }) || {}).username,
			pattern: settings.get('UTF8_User_Names_Validation'),
			useRealName: settings.get('UI_Use_Real_Name'),
		};

		import('../../../app/mentions/client').then(({ createMentionsMessageRenderer }) => {
			const renderMessage = createMentionsMessageRenderer(options);
			callbacks.remove('renderMessage', 'mentions-message');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'mentions-message');
		});
	});
});
