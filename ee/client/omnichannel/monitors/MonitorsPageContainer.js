import React from 'react';

import NotAuthorizedPage from '../../../../client/components/NotAuthorizedPage';
import PageSkeleton from '../../../../client/components/PageSkeleton';
import { useHasLicense } from '../../hooks/useHasLicense';
import MonitorsPage from './MonitorsPage';

const MonitorsPageContainer = () => {
	const license = useHasLicense('livechat-enterprise');

	if (license === 'loading') {
		return <PageSkeleton />;
	}

	if (!license) {
		return <NotAuthorizedPage />;
	}

	return <MonitorsPage />;
};

export default MonitorsPageContainer;
