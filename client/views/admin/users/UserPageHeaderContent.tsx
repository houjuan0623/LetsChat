import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const UserPageHeaderContent = (): ReactElement => {
	const usersRoute = useRoute('admin-users');
	const t = useTranslation();

	const handleNewButtonClick = (): void => {
		usersRoute.push({ context: 'new' });
	};

	const handleInviteButtonClick = (): void => {
		usersRoute.push({ context: 'invite' });
	};

	return (
		<>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick}>
					<Icon size='x20' name='user-plus' /> {t('New')}
				</Button>
				<Button onClick={handleInviteButtonClick}>
					<Icon size='x20' name='mail' /> {t('Invite')}
				</Button>
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContent;
