import { Story } from '@storybook/react';
import React from 'react';

import NotAuthorizedPage from './NotAuthorizedPage';

export default {
	title: 'admin/NotAuthorizedPage',
	component: NotAuthorizedPage,
};

export const _default: Story = () => <NotAuthorizedPage />;
