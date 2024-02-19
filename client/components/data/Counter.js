import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import Growth from './Growth';

function Counter({ count, variation = 0, description }) {
	return (
		<>
			<Flex.Container alignItems='end'>
				<Box>
					<Box
						is='span'
						color='default'
						fontScale='h1'
						style={{
							fontSize: '3em',
							lineHeight: 1,
						}}
					>
						{count}
					</Box>
					<Growth fontScale='s1'>{variation}</Growth>
				</Box>
			</Flex.Container>
			<Margins block='x12'>
				<Flex.Container alignItems='center'>
					<Box fontScale='p1' color='hint'>
						{description}
					</Box>
				</Flex.Container>
			</Margins>
		</>
	);
}

export default Counter;
