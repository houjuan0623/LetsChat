import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserCard from '../../../../../components/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';

const AgentField = ({ agent }) => {
	const t = useTranslation();
	const { username } = agent;
	const { value, phase: state } = useEndpointData(`users.info?username=${username}`);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	const {
		user: { name, status },
	} = value || { user: {} };

	const displayName = name || username;

	return (
		<Field>
			<Label>{t('Agent')}</Label>
			<Info style={{ display: 'flex' }}>
				<UserAvatar size='x40' title={username} username={username} />
				<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
				{username && name && (
					<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>
						({username})
					</Box>
				)}
			</Info>
		</Field>
	);
};

export default AgentField;
