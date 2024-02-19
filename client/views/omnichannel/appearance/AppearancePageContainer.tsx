import { Callout } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import AppearancePage from './AppearancePage';

const AppearancePageContainer: FC = () => {
	const t = useTranslation();

	const { value: data, phase: state, error } = useEndpointData('livechat/appearance');

	const canViewAppearance = usePermission('view-livechat-appearance');

	if (!canViewAppearance) {
		return <NotAuthorizedPage />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return <PageSkeleton />;
	}

	if (!data || !data.appearance || error) {
		return (
			<Page>
				<Page.Header title={t('Edit_Custom_Field')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	return <AppearancePage settings={data.appearance} />;
};

export default AppearancePageContainer;
