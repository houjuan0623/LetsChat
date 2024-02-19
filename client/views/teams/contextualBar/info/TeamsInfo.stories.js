import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import TeamsInfo from './TeamsInfo';

export default {
	title: 'teams/TeamsInfo',
	component: TeamsInfo,
};

const room = {
	fname: 'rocketchat-frontend-team',
	description:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	announcement:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	topic:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
};

export const Default = () => (
	<VerticalBar height={800}>
		<TeamsInfo
			{...room}
			icon='lock'
			onClickHide={alert}
			onClickLeave={alert}
			onClickEdit={alert}
			onClickDelete={alert}
		/>
	</VerticalBar>
);

export const Archived = () => (
	<VerticalBar height={800}>
		<TeamsInfo
			{...room}
			icon='lock'
			onClickHide={alert}
			onClickLeave={alert}
			onClickEdit={alert}
			onClickDelete={alert}
			archived
		/>
	</VerticalBar>
);

export const Broadcast = () => (
	<VerticalBar height={800}>
		<TeamsInfo
			{...room}
			icon='lock'
			onClickHide={alert}
			onClickLeave={alert}
			onClickEdit={alert}
			onClickDelete={alert}
			broadcast
		/>
	</VerticalBar>
);
