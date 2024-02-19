import { Box, Divider } from '@rocket.chat/fuselage';
import React from 'react';

const ShortcutSection = ({ title, command }) => (
	<Box is='section' mb='x16'>
		<Box fontScale='p2' fontWeight='700'>
			{title}
		</Box>
		<Divider />
		<Box fontScale='p1'>{command}</Box>
	</Box>
);

export default ShortcutSection;
