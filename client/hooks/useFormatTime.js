import moment from 'moment';
import { useCallback } from 'react';

import { useSetting } from '../contexts/SettingsContext';
import { useUserPreference } from '../contexts/UserContext';

const dayFormat = ['h:mm A', 'H:mm'];

export const useFormatTime = () => {
	const clockMode = useUserPreference('clockMode', false);
	const format = useSetting('Message_TimeFormat');
	const sameDay = dayFormat[clockMode - 1] || format;
	return useCallback(
		(time) => {
			switch (clockMode) {
				case 1:
				case 2:
					return moment(time).format(sameDay);
				default:
					return moment(time).format(format);
			}
		},
		[clockMode, format, sameDay],
	);
};
