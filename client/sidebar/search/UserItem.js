import { Sidebar } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import { roomTypes } from '../../../app/utils/client';
import { ReactiveUserStatus } from '../../components/UserStatus';

const UserItem = ({ item, id, style, t, SideBarItemTemplate, AvatarTemplate, useRealName }) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = (
		<Sidebar.Item.Icon>
			<ReactiveUserStatus uid={item._id} />
		</Sidebar.Item.Icon>
	);
	const href = roomTypes.getRouteLink(item.t, item);

	return (
		<SideBarItemTemplate
			is='a'
			style={{ height: '100%' }}
			id={id}
			href={href}
			title={title}
			subtitle={t('No_messages_yet')}
			avatar={AvatarTemplate && <AvatarTemplate {...item} />}
			icon={icon}
			style={style}
		/>
	);
};

export default memo(UserItem);
