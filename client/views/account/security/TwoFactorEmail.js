import { Box, Button, Margins } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useUser } from '../../../contexts/UserContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

const TwoFactorEmail = (props) => {
	const t = useTranslation();
	const user = useUser();

	const isEnabled =
		user && user.services && user.services.email2fa && user.services.email2fa.enabled;

	const enable2faAction = useEndpointAction(
		'POST',
		'users.2fa.enableEmail',
		undefined,
		t('Two-factor_authentication_enabled'),
	);
	const disable2faAction = useEndpointAction(
		'POST',
		'users.2fa.disableEmail',
		undefined,
		t('Two-factor_authentication_disabled'),
	);

	const handleEnable = useCallback(async () => {
		await enable2faAction();
	}, [enable2faAction]);
	const handleDisable = useCallback(async () => {
		await disable2faAction();
	}, [disable2faAction]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs='x16' {...props}>
			<Margins blockEnd='x8'>
				<Box fontScale='s2'>{t('Two-factor_authentication_email')}</Box>
				{isEnabled && (
					<Button primary danger onClick={handleDisable}>
						{t('Disable_two-factor_authentication_email')}
					</Button>
				)}
				{!isEnabled && (
					<>
						<Box>{t('Two-factor_authentication_email_is_currently_disabled')}</Box>
						<Button primary onClick={handleEnable}>
							{t('Enable_two-factor_authentication_email')}
						</Button>
					</>
				)}
			</Margins>
		</Box>
	);
};

export default TwoFactorEmail;
