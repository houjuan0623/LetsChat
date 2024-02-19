import { Sidebar } from '@rocket.chat/fuselage';
import React from 'react';

import { popover } from '../../../../app/ui-utils/client';
import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';

const CREATE_ROOM_PERMISSIONS = [
	'create-c',
	'create-p',
	'create-d',
	'start-discussion',
	'start-discussion-other-user',
];

const config = (e) => ({
	template: 'CreateRoomList',
	data: {
		options: [],
	},
	currentTarget: e.currentTarget,
	offsetVertical: e.currentTarget.clientHeight + 10,
});

const CreateRoom = (props) => {
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);
	const onClick = (e) => {
		popover.open(config(e));
	};

	return showCreate ? (
		<Sidebar.TopBar.Action {...props} icon='edit-rounded' onClick={onClick} />
	) : null;
};

export default CreateRoom;
