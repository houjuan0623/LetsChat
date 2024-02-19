import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { FormSkeleton } from './Skeleton';
import Chat from './chats/Chat';
import ChatInfoDirectory from './chats/contextualBar/ChatInfoDirectory';
import RoomEditWithData from './chats/contextualBar/RoomEditWithData';

const ChatsContextualBar = ({ chatReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');

	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id');

	const t = useTranslation();

	const openInRoom = () => {
		directoryRoute.push({ page: 'chats', id, bar: 'view' });
	};

	const handleChatsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ page: 'chats' });
	};

	const handleChatsVerticalBarBackButtonClick = () => {
		directoryRoute.push({ page: 'chats', id, bar: 'info' });
	};

	const {
		value: data,
		phase: state,
		error,
		reload: reloadInfo,
	} = useEndpointData(`rooms.info?roomId=${id}`);

	if (bar === 'view') {
		return <Chat rid={id} />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box pi='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{bar === 'info' && (
					<>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
						<VerticalBar.Action
							title={t('View_full_conversation')}
							name={'new-window'}
							onClick={openInRoom}
						/>
					</>
				)}
				{bar === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('edit-room')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={handleChatsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{bar === 'info' && <ChatInfoDirectory id={id} room={data.room} />}
			{bar === 'edit' && (
				<RoomEditWithData
					id={id}
					close={handleChatsVerticalBarBackButtonClick}
					reload={chatReload}
					reloadInfo={reloadInfo}
				/>
			)}
		</VerticalBar>
	);
};

export default ChatsContextualBar;
