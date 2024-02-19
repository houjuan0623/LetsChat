import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';

import { settings } from '../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const user = Meteor.user();
		if (
			user &&
			user.emails &&
			user.emails[0] &&
			user.emails[0].verified !== true &&
			settings.get('Accounts_EmailVerification') === true &&
			!Session.get('Accounts_EmailVerification_Warning')
		) {
			toastr.warning(TAPi18n.__('You_have_not_verified_your_email'));
			Session.set('Accounts_EmailVerification_Warning', true);
		}
	});
});
