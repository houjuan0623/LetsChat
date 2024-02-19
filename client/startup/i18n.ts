import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { Users } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { isRtl } from '../../app/utils/client';

const currentLanguage = new ReactiveVar<string | null>(null);

Meteor.startup(() => {
	// eslint-disable-next-line @typescript-eslint/camelcase
	TAPi18n.conf.i18n_files_route = Meteor._relativeToSiteRootUrl('/tap-i18n');
	currentLanguage.set(Meteor._localStorage.getItem('userLanguage'));

	const availableLanguages = TAPi18n.getLanguages();

	const filterLanguage = (language: string): string => {
		// Fix browsers having all-lowercase language settings eg. pt-br, en-us
		const regex = /([a-z]{2,3})-([a-z]{2,4})/;
		const matches = regex.exec(language);
		if (matches) {
			return `${matches[1]}-${matches[2].toUpperCase()}`;
		}

		return language;
	};

	const getBrowserLanguage = (): string =>
		filterLanguage(window.navigator.userLanguage ?? window.navigator.language);

	const loadMomentLocale = (language: string): Promise<string> =>
		new Promise((resolve, reject) => {
			if (moment.locales().includes(language.toLowerCase())) {
				resolve(language);
				return;
			}

			Meteor.call('loadLocale', language, (error: unknown, localeSrc: string) => {
				if (error) {
					reject(error);
					return;
				}

				Function(localeSrc).call({ moment });
				resolve(language);
			});
		});

	const applyLanguage = (language: string | undefined = 'en'): void => {
		language = filterLanguage(language);

		if (!availableLanguages[language]) {
			language = language.split('-').shift();
		}

		if (!language) {
			return;
		}
		document.documentElement.classList[isRtl(language) ? 'add' : 'remove']('rtl');
		document.documentElement.setAttribute('dir', isRtl(language) ? 'rtl' : 'ltr');
		document.documentElement.lang = language;

		TAPi18n.setLanguage(language);
		loadMomentLocale(language)
			.then((locale) => moment.locale(locale))
			.catch((error) => {
				moment.locale('en');
				console.error('Error loading moment locale:', error);
			});
	};

	const setLanguage = (language: string): void => {
		const lang = filterLanguage(language);
		currentLanguage.set(lang);
		Meteor._localStorage.setItem('userLanguage', lang);
	};
	window.setLanguage = setLanguage;

	const defaultUserLanguage = (): string =>
		settings.get('Language') || getBrowserLanguage() || 'en';
	window.defaultUserLanguage = defaultUserLanguage;

	Tracker.autorun(() => {
		const user = Users.findOne(Meteor.userId(), { fields: { language: 1 } });

		setLanguage((user && user.language) || defaultUserLanguage());
	});

	Tracker.autorun(() => {
		const language = currentLanguage.get();
		if (language) {
			applyLanguage(language);
		}
	});
});
