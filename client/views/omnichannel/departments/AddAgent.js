import { Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

function AddAgent({ agentList, setAgentList, ...props }) {
	const t = useTranslation();
	const [userId, setUserId] = useState();
	const getAgent = useEndpointAction('GET', `livechat/users/agent/${userId}`);
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgent = useMutableCallback((e) => setUserId(e));

	const handleSave = useMutableCallback(async () => {
		if (!userId) {
			return;
		}
		const { user } = await getAgent();

		if (agentList.filter((e) => e.agentId === user._id).length === 0) {
			setAgentList([{ ...user, agentId: user._id }, ...agentList]);
			setUserId();
		} else {
			dispatchToastMessage({ type: 'error', message: t('This_agent_was_already_selected') });
		}
	});
	return (
		<Box display='flex' alignItems='center' {...props}>
			<AutoCompleteAgent empty value={userId} onChange={handleAgent} />
			<Button disabled={!userId} onClick={handleSave} mis='x8' primary>
				{t('Add')}
			</Button>
		</Box>
	);
}

export default AddAgent;
