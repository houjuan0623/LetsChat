import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import AddAgent from './AddAgent';
import AgentRow from './AgentRow';

function DepartmentsAgentsTable({ agents, setAgentListFinal }) {
	const t = useTranslation();
	const [agentList, setAgentList] = useState((agents && JSON.parse(JSON.stringify(agents))) || []);

	useEffect(() => setAgentListFinal(agentList), [agentList, setAgentListFinal]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	return (
		<>
			<AddAgent agentList={agentList} setAgentList={setAgentList} />
			<GenericTable
				header={
					<>
						<GenericTable.HeaderCell key={'name'} w='x200'>
							{t('Name')}
						</GenericTable.HeaderCell>
						<GenericTable.HeaderCell key={'Count'} w='x140'>
							{t('Count')}
						</GenericTable.HeaderCell>
						<GenericTable.HeaderCell key={'Order'} w='x120'>
							{t('Order')}
						</GenericTable.HeaderCell>
						<GenericTable.HeaderCell key={'remove'} w='x40'>
							{t('Remove')}
						</GenericTable.HeaderCell>
					</>
				}
				results={agentList}
				total={agentList?.length}
				pi='x24'
			>
				{(props) => (
					<AgentRow
						key={props._id}
						mediaQuery={mediaQuery}
						agentList={agentList}
						setAgentList={setAgentList}
						{...props}
					/>
				)}
			</GenericTable>
		</>
	);
}

export default DepartmentsAgentsTable;
