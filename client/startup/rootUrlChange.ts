import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';

import { hasRole } from '../../app/authorization/client';
import { Roles } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/client';
import UrlChangeModal from '../components/UrlChangeModal';
import { imperativeModal } from '../lib/imperativeModal';
import { isSyncReady } from '../lib/userData';

Meteor.startup(() => {
	Tracker.autorun((c) => {
		if (!Meteor.userId()) {
			return;
		}

		if (!Roles.ready.get() || !isSyncReady.get()) {
			return;
		}

		if (hasRole(Meteor.userId(), 'admin') === false) {
			return c.stop();
		}

		const siteUrl = settings.get('Site_Url');
		if (!siteUrl) {
			return;
		}

		const currentUrl = location.origin + window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
		if (window.__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') !== currentUrl) {
			const confirm = (): void => {
				imperativeModal.close();
				Meteor.call('saveSetting', 'Site_Url', currentUrl, () => {
					toastr.success(t('Saved'));
				});
			};
			imperativeModal.open({
				component: UrlChangeModal,
				props: {
					onConfirm: confirm,
					siteUrl,
					currentUrl,
					onClose: imperativeModal.close,
				},
			});
		}

		const documentDomain = settings.get('Document_Domain');
		if (documentDomain) {
			window.document.domain = documentDomain;
		}

		return c.stop();
	});
});
