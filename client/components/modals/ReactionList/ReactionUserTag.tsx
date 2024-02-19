import { Box, Tag } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { IUser } from '../../../../definition/IUser';

type ReactionUserTag = {
	username: IUser['username'];
	onClick: (e: React.MouseEvent<HTMLElement>) => void;
	displayName: string;
};

const ReactionUserTag = ({ username, onClick, displayName }: ReactionUserTag): ReactElement => (
	<Box mie='x4' mbe='x4' data-username={username} onClick={onClick} key={displayName}>
		<Tag variant='secondary'>{displayName}</Tag>
	</Box>
);

export default ReactionUserTag;
