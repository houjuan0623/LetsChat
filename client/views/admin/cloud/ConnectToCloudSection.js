import { Box, Button, ButtonGroup, Throbber, Callout } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import Subtitle from '../../../components/Subtitle';
import { useMethod } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

function ConnectToCloudSection({ onRegisterStatusChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isConnecting, setConnecting] = useSafely(useState(false));

	const registerWorkspace = useMethod('cloud:registerWorkspace');
	const syncWorkspace = useMethod('cloud:syncWorkspace');
	const hasAcceptedTerms = useSetting('Cloud_Service_Agree_PrivacyTerms');

	const handleRegisterButtonClick = async () => {
		setConnecting(true);

		try {
			const isRegistered = await registerWorkspace();

			if (!isRegistered) {
				throw Error(t('An error occured'));
			}

			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}

			dispatchToastMessage({ type: 'success', message: t('Sync Complete') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onRegisterStatusChange && onRegisterStatusChange());
			setConnecting(false);
		}
	};

	return (
		<Box is='section' {...props}>
			<Subtitle>{t('Cloud_registration_required')}</Subtitle>
			<Box withRichContent color='neutral-800'>
				<p>{t('Cloud_registration_required_description')}</p>
			</Box>
			<ButtonGroup>
				<Button
					primary
					disabled={isConnecting || !hasAcceptedTerms}
					minHeight='x40'
					onClick={handleRegisterButtonClick}
				>
					{isConnecting ? (
						<Throbber is='span' inheritColor />
					) : (
						t('Cloud_registration_required_link_text')
					)}
				</Button>
			</ButtonGroup>
			{!hasAcceptedTerms && (
				<Box mb='x12'>
					<Callout type='warning'>
						{t('Cloud_Service_Agree_PrivacyTerms_Login_Disabled_Warning')}
					</Callout>
				</Box>
			)}
		</Box>
	);
}

export default ConnectToCloudSection;
