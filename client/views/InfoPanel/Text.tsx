import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const wordBreak = css`
	word-break: break-word;
`;

const Text: FC<ComponentProps<typeof Box>> = (props) => (
	<Box mb='x8' fontScale='p1' color='hint' withTruncatedText className={wordBreak} {...props} />
);

export default Text;
