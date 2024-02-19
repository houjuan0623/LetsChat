import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

createTemplateForComponent('MessageActions', () => import('./components/Message/Actions'));

createTemplateForComponent('reactAttachments', () => import('./components/Message/Attachments'));

createTemplateForComponent('ThreadMetric', () => import('./components/Message/Metrics/Thread'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'min-height: 36px;',
		}),
});

createTemplateForComponent(
	'DiscussionMetric',
	() => import('./components/Message/Metrics/Discussion'),
	{
		renderContainerView: () =>
			HTML.DIV({
				style: 'min-height: 36px;',
			}),
	},
);

createTemplateForComponent('MessageBody', () => import('./components/Message/Body'));

createTemplateForComponent(
	'BroadCastMetric',
	() => import('./components/Message/Metrics/Broadcast'),
);

createTemplateForComponent(
	'Checkbox',
	async (): Promise<{ default: typeof import('@rocket.chat/fuselage').CheckBox }> => {
		const { CheckBox } = await import('@rocket.chat/fuselage');
		return { default: CheckBox };
	},
	{
		attachment: 'at-parent',
	},
);

createTemplateForComponent('RoomForeword', () => import('./components/RoomForeword'), {
	attachment: 'at-parent',
});

createTemplateForComponent(
	'accountSecurity',
	() => import('./views/account/security/AccountSecurityPage'),
	{
		attachment: 'at-parent',
	},
);

createTemplateForComponent('messageLocation', () => import('./views/location/MessageLocation'));

createTemplateForComponent('sidebarHeader', () => import('./sidebar/header'));

createTemplateForComponent('sidebarChats', () => import('./sidebar/RoomList/index'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'display: flex; flex: 1 1 100%;',
		}),
});

createTemplateForComponent(
	'omnichannelFlex',
	() => import('./views/omnichannel/sidebar/OmnichannelSidebar'),
	{
		renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
	},
);

createTemplateForComponent('auditPage', () => import('../ee/client/audit/AuditPage'), {
	attachment: 'at-parent',
});

createTemplateForComponent('auditLogPage', () => import('../ee/client/audit/AuditLogPage'), {
	attachment: 'at-parent',
});

createTemplateForComponent(
	'DiscussionMessageList',
	() => import('./views/room/contextualBar/Discussions'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent('ThreadsList', () => import('./views/room/contextualBar/Threads'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
});

createTemplateForComponent(
	'ExportMessages',
	() => import('./views/room/contextualBar/ExportMessages'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'KeyboardShortcuts',
	() => import('./views/room/contextualBar/KeyboardShortcuts'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent('room', () => import('./views/room/Room'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent(
	'AutoTranslate',
	() => import('./views/room/contextualBar/AutoTranslate'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'NotificationsPreferences',
	() => import('./views/room/contextualBar/NotificationPreferences'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'InviteUsers',
	() => import('./views/room/contextualBar/RoomMembers/InviteUsers'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'EditInvite',
	() => import('./views/room/contextualBar/RoomMembers/EditInvite'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'AddUsers',
	() => import('./views/room/contextualBar/RoomMembers/AddUsers'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent('membersList', () => import('./views/room/contextualBar/RoomMembers'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
});

createTemplateForComponent('OTR', () => import('./views/room/contextualBar/OTR'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
});

createTemplateForComponent(
	'EditRoomInfo',
	() => import('./views/room/contextualBar/Info/EditRoomInfo'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent('RoomInfo', () => import('./views/room/contextualBar/Info/RoomInfo'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
});

createTemplateForComponent(
	'UserInfoWithData',
	() => import('./views/room/contextualBar/UserInfo'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent(
	'channelFilesList',
	() => import('./views/room/contextualBar/RoomFiles'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent('RoomAnnouncement', () => import('./views/room/Announcement'));

createTemplateForComponent(
	'PruneMessages',
	() => import('./views/room/contextualBar/PruneMessages'),
	{
		renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }),
	},
);

createTemplateForComponent('Burger', () => import('./components/BurgerMenu'));

createTemplateForComponent(
	'resetPassword',
	() => import('./views/login/ResetPassword/ResetPassword'),
	{
		renderContainerView: () => HTML.DIV({ style: 'display: flex;' }),
	},
);

createTemplateForComponent('ModalBlock', () => import('./views/blocks/ConnectedModalBlock'), {
	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
});

createTemplateForComponent('Blocks', () => import('./views/blocks/MessageBlock'));

createTemplateForComponent('adminFlex', () => import('./views/admin/sidebar/AdminSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent('accountFlex', () => import('./views/account/AccountSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent('SortList', () => import('./components/SortList'));

createTemplateForComponent(
	'CreateRoomList',
	() => import('./sidebar/header/actions/CreateRoomList'),
);

createTemplateForComponent('UserDropdown', () => import('./sidebar/header/UserDropdown'));

createTemplateForComponent('StatusMessage', () => import('./components/Message/StatusMessage'), {
	renderContainerView: () =>
		HTML.DIV({
			class: 'message-custom-status',
		}),
});

createTemplateForComponent('sidebarFooter', () => import('./sidebar/footer'));
