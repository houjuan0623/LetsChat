import { useMemo, useCallback } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import { useSetting } from '../../../client/contexts/SettingsContext';
import { usePermission } from '../../../client/contexts/AuthorizationContext';
import { useMethod } from '../../../client/contexts/ServerContext';
import { useReactiveValue } from '../../../client/hooks/useReactiveValue';
import { e2e } from './rocketchat.e2e';

addAction('e2e', ({ room }) => {
	const e2eEnabled = useSetting('E2E_Enable');
	const e2eReady = useReactiveValue(useCallback(() => e2e.isReady(), [])) || room.encrypted;
	const canToggleE2e = usePermission('toggle-room-e2e-encryption', room._id);
	const canEditRoom = usePermission('edit-room', room._id);
	const hasPermission = (room.t === 'd' || (canEditRoom && canToggleE2e)) && e2eReady;

	const toggleE2E = useMethod('saveRoomSettings');

	const action = useMutableCallback(() => {
		toggleE2E(room._id, 'encrypted', !room.encrypted);
	});

	const enabledOnRoom = !!room.encrypted;

	return useMemo(() => (e2eEnabled && hasPermission ? {
		groups: ['direct', 'direct_multiple', 'group', 'team'],
		id: 'e2e',
		title: enabledOnRoom ? 'E2E_disable' : 'E2E_enable',
		icon: 'key',
		order: 13,
		action,
	} : null), [action, e2eEnabled, enabledOnRoom, hasPermission]);
});
