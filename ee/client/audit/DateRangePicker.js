import { Box, InputBox, Menu, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo, useEffect } from 'react';

import { useTranslation } from '../../../client/contexts/TranslationContext';

const date = new Date();

const formatToDateInput = (date) => date.toISOString().slice(0, 10);

const todayDate = formatToDateInput(date);

const getMonthRange = (monthsToSubtractFromToday) => {
	const date = new Date();
	return {
		start: formatToDateInput(
			new Date(date.getFullYear(), date.getMonth() - monthsToSubtractFromToday, 1),
		),
		end: formatToDateInput(
			new Date(date.getFullYear(), date.getMonth() - monthsToSubtractFromToday + 1, 0),
		),
	};
};

const getWeekRange = (daysToSubtractFromStart, daysToSubtractFromEnd) => {
	const date = new Date();
	return {
		start: formatToDateInput(
			new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToSubtractFromStart),
		),
		end: formatToDateInput(
			new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToSubtractFromEnd),
		),
	};
};

const DateRangePicker = ({ onChange = () => {}, ...props }) => {
	const t = useTranslation();
	const [range, setRange] = useState({ start: '', end: '' });

	const { start, end } = range;

	const handleStart = useMutableCallback(({ currentTarget }) => {
		const rangeObj = {
			start: currentTarget.value,
			end: range.end,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleEnd = useMutableCallback(({ currentTarget }) => {
		const rangeObj = {
			end: currentTarget.value,
			start: range.start,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleRange = useMutableCallback((range) => {
		setRange(range);
		onChange(range);
	});

	useEffect(() => {
		handleRange({
			start: todayDate,
			end: todayDate,
		});
	}, [handleRange]);

	const options = useMemo(
		() => ({
			today: {
				icon: 'history',
				label: t('Today'),
				action: () => {
					handleRange(getWeekRange(0, 0));
				},
			},
			yesterday: {
				icon: 'history',
				label: t('Yesterday'),
				action: () => {
					handleRange(getWeekRange(1, 1));
				},
			},
			thisWeek: {
				icon: 'history',
				label: t('This_week'),
				action: () => {
					handleRange(getWeekRange(7, 0));
				},
			},
			previousWeek: {
				icon: 'history',
				label: t('Previous_week'),
				action: () => {
					handleRange(getWeekRange(14, 7));
				},
			},
			thisMonth: {
				icon: 'history',
				label: t('This_month'),
				action: () => {
					handleRange(getMonthRange(0));
				},
			},
			lastMonth: {
				icon: 'history',
				label: t('Previous_month'),
				action: () => {
					handleRange(getMonthRange(1));
				},
			},
		}),
		[handleRange, t],
	);

	return (
		<Box mi='neg-x4' {...props}>
			<Margins inline='x4'>
				<InputBox
					type='date'
					onChange={handleStart}
					max={todayDate}
					value={start}
					flexGrow={1}
					h='x20'
				/>
				<InputBox
					type='date'
					onChange={handleEnd}
					max={todayDate}
					min={start}
					value={end}
					flexGrow={1}
					h='x20'
				/>
				<Menu options={options} alignSelf='center' />
			</Margins>
		</Box>
	);
};

export default DateRangePicker;
