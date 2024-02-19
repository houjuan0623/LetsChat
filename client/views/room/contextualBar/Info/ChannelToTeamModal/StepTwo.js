import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const StepTwo = ({ onClose, onCancel, onConfirm }) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon='warning'
			title={t('Confirmation')}
			confirmText='Yes'
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<Box>{t('Teams_move_channel_to_team_confirm_description')}</Box>
		</GenericModal>
	);
};

export default StepTwo;
