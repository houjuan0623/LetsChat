import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';

Meteor.startup(() => {
	Tracker.autorun((c) => {
		if (!settings.get('Webdav_Integration_Enabled')) {
			return;
		}
		c.stop();
		import('./startup/messageBoxActions');
		import('./startup/sync');
		import('./actionButton');
		import('./addWebdavAccount.html');
		import('./addWebdavAccount');
		import('./webdavFilePicker.html');
		import('./webdavFilePicker.css');
		import('./webdavFilePicker');
		import('./selectWebdavAccount.html');
		import('./selectWebdavAccount');
	});
});
