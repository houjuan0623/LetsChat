import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Section: FC<ComponentProps<typeof Box>> = (props) => <Box mb='x24' {...props} />;

export default Section;
