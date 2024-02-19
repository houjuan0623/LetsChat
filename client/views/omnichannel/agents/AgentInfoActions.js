import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import AgentInfo from './AgentInfo';

function AgentInfoActions({ reload }) {
	const t = useTranslation();
	const _id = useRouteParameter('id');
	const agentsRoute = useRoute('omnichannel-agents');
	const deleteAction = useEndpointAction('DELETE', `livechat/users/agent/${_id}`);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRemoveClick = useMutableCallback(async () => {
		const result = await deleteAction();
		if (result.success === true) {
			agentsRoute.push({});
			reload();
		}
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	const handleEditClick = useMutableCallback(() =>
		agentsRoute.push({
			context: 'edit',
			id: _id,
		}),
	);

	return [
		<AgentInfo.Action
			key={t('Remove')}
			title={t('Remove')}
			label={t('Remove')}
			onClick={handleDelete}
			icon={'trash'}
		/>,
		<AgentInfo.Action
			key={t('Edit')}
			title={t('Edit')}
			label={t('Edit')}
			onClick={handleEditClick}
			icon={'edit'}
		/>,
	];
}

export default AgentInfoActions;
