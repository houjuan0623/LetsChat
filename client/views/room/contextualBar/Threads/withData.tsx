import { useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import React, { FC, useCallback, useMemo, useState } from 'react';

import { useUserId, useUserSubscription } from '../../../../contexts/UserContext';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { ThreadsListOptions } from '../../../../lib/lists/ThreadsList';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import { ThreadListProps } from './ThreadList';
import { useThreadsList } from './useThreadsList';

const subscriptionFields = { tunread: true, tunreadUser: true, tunreadGroup: true };
const roomFields = { t: 1, name: 1 };

export function withData(Component: FC<ThreadListProps>): FC<{ rid: string }> {
	const WrappedComponent: FC<{ rid: string }> = ({ rid, ...props }) => {
		const userId = useUserId();
		const onClose = useTabBarClose();
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);

		const [type, setType] = useLocalStorage<'all' | 'following' | 'unread'>(
			'thread-list-type',
			'all',
		);

		const [text, setText] = useState('');
		const debouncedText = useDebouncedValue(text, 400);
		const options: ThreadsListOptions = useDebouncedValue(
			useMemo(() => {
				if (type === 'all' || !subscription || !userId) {
					return {
						rid,
						text: debouncedText,
						type: 'all',
					};
				}
				switch (type) {
					case 'following':
						return {
							rid,
							text: debouncedText,
							type,
							uid: userId,
						};
					case 'unread':
						return {
							rid,
							text: debouncedText,
							type,
							tunread: subscription?.tunread,
						};
				}
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [rid, debouncedText, type, subscription?.tunread?.sort().join(), userId]),
			300,
		);

		const { threadsList, loadMoreItems } = useThreadsList(options, userId as string);
		const { phase, error, items: threads, itemCount: totalItemCount } = useRecordList(threadsList);

		const handleTextChange = useCallback((event) => {
			setText(event.currentTarget.value);
		}, []);

		return (
			<Component
				{...props}
				unread={subscription?.tunread}
				unreadUser={subscription?.tunreadUser}
				unreadGroup={subscription?.tunreadGroup}
				userId={userId}
				error={error}
				threads={threads}
				total={totalItemCount}
				loading={phase === AsyncStatePhase.LOADING}
				loadMoreItems={loadMoreItems}
				room={room}
				text={text}
				setText={handleTextChange}
				type={type}
				setType={setType as any}
				onClose={onClose as any}
			/>
		);
	};

	WrappedComponent.displayName = `withData(${
		Component.displayName ?? Component.name ?? 'Component'
	})`;

	return WrappedComponent;
}
