import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Wrapper = (text) => (
	<Box
		fontFamily='mono'
		alignSelf='center'
		fontScale='p1'
		style={{ wordBreak: 'break-all' }}
		mie='x4'
		flexGrow={1}
		withRichContent
	>
		<pre>
			<code>{text}</code>
		</pre>
	</Box>
);

export default Wrapper;
