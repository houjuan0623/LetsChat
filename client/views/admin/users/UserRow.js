import { Box, Table } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import React from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../contexts/TranslationContext';

const style = {
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	overflow: 'hidden',
};

const UserRow = ({
	emails,
	_id,
	username,
	name,
	roles,
	status,
	avatarETag,
	onClick,
	mediaQuery,
	active,
}) => {
	const t = useTranslation();

	const statusText = active ? t(capitalize(status)) : t('Disabled');
	return (
		<Table.Row
			onKeyDown={onClick(_id)}
			onClick={onClick(_id)}
			tabIndex={0}
			role='link'
			action
			qa-user-id={_id}
		>
			<Table.Cell style={style}>
				<Box display='flex' alignItems='center'>
					<UserAvatar
						size={mediaQuery ? 'x28' : 'x40'}
						title={username}
						username={username}
						etag={avatarETag}
					/>
					<Box display='flex' style={style} mi='x8'>
						<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
							<Box fontScale='p2' style={style} color='default'>
								{name || username}
							</Box>
							{!mediaQuery && name && (
								<Box fontScale='p1' color='hint' style={style}>
									{' '}
									{`@${username}`}{' '}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</Table.Cell>
			{mediaQuery && (
				<Table.Cell>
					<Box fontScale='p2' style={style} color='hint'>
						{username}
					</Box>{' '}
					<Box mi='x4' />
				</Table.Cell>
			)}
			<Table.Cell style={style}>{emails && emails.length && emails[0].address}</Table.Cell>
			{mediaQuery && <Table.Cell style={style}>{roles && roles.join(', ')}</Table.Cell>}
			<Table.Cell fontScale='p1' color='hint' style={style}>
				{statusText}
			</Table.Cell>
		</Table.Row>
	);
};

export default UserRow;
