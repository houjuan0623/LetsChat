import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models';
import { TranslationProviderRegistry } from '..';

Meteor.methods({
	'autoTranslate.translateMessage'(message, targetLanguage) {
		if (!TranslationProviderRegistry.enabled) {
			return;
		}
		const room = Rooms.findOneById(message && message.rid);
		if (message && room) {
			TranslationProviderRegistry.translateMessage(message, room, targetLanguage);
		}
	},
});
