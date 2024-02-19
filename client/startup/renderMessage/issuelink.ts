import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks/client';
import { settings } from '../../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('IssueLinks_Enabled');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'issuelink');
			return;
		}

		const options = {
			template: settings.get('IssueLinks_Template'),
		};

		import('../../../app/issuelinks/client').then(({ createIssueLinksMessageRenderer }) => {
			const renderMessage = createIssueLinksMessageRenderer(options);
			callbacks.remove('renderMessage', 'issuelink');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'issuelink');
		});
	});
});
