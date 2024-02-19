import React from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { useRouteParameter } from '../../../contexts/RouterContext';
import { useIsPrivilegedSettingsContext } from '../../../contexts/SettingsContext';
import EditableSettingsProvider from '../../../providers/EditableSettingsProvider';
import GroupSelector from './GroupSelector';

export function SettingsRoute() {
	const hasPermission = useIsPrivilegedSettingsContext();

	const groupId = useRouteParameter('group');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return (
		<EditableSettingsProvider>
			<GroupSelector groupId={groupId} />
		</EditableSettingsProvider>
	);
}

export default SettingsRoute;
