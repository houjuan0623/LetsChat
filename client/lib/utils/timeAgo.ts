import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment, { Moment, MomentInput } from 'moment';

import { settings } from '../../../app/settings/client';
import { t } from '../../../app/utils/client';
import { getUserPreference } from '../../../app/utils/lib/getUserPreference';

const dayFormat = ['h:mm A', 'H:mm'];

export const timeAgo = (date: MomentInput): string => {
	const clockMode = Tracker.nonreactive(() =>
		getUserPreference(Meteor.userId(), 'clockMode', false),
	);
	const messageTimeFormat = Tracker.nonreactive(() => settings.get('Message_TimeFormat'));
	const sameDay = dayFormat[clockMode - 1] || messageTimeFormat;

	return moment(date).calendar(null, {
		lastDay: `[${t('yesterday')}]`,
		sameDay,
		lastWeek: 'dddd',
		sameElse(this: Moment, now) {
			const diff = Math.ceil(this.diff(now, 'years', true));
			return diff < 0 ? 'MMM D YYYY' : 'MMM D';
		},
	});
};
