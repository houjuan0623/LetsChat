import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../../app/authorization/client';
import { callbacks } from '../../../app/callbacks/client';
import { settings } from '../../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('AutoTranslate_Enabled') && hasPermission('auto-translate');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'autotranslate');
			return;
		}

		import('../../../app/autotranslate/client').then(({ createAutoTranslateMessageRenderer }) => {
			const renderMessage = createAutoTranslateMessageRenderer();
			callbacks.remove('renderMessage', 'autotranslate');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH - 3, 'autotranslate');
		});
	});
});
