import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Discussion', function() {
		// the channel for which discussions are created if none is explicitly chosen

		this.add('Discussion_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
	});

	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	settings.add('RetentionPolicy_DoNotPruneDiscussion', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotPruneDiscussion',
		i18nDescription: 'RetentionPolicy_DoNotPruneDiscussion_Description',
		enableQuery: globalQuery,
	});

	settings.add('RetentionPolicy_DoNotPruneThreads', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotPruneThreads',
		i18nDescription: 'RetentionPolicy_DoNotPruneThreads_Description',
		enableQuery: globalQuery,
	});
});
