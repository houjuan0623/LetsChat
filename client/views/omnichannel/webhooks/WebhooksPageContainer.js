import { Callout } from '@rocket.chat/fuselage';
import React from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import WebhooksPage from './WebhooksPage';

const reduceSettings = (settings) =>
	settings.reduce((acc, { _id, value }) => {
		acc = { ...acc, [_id]: value };
		return acc;
	}, {});

const WebhooksPageContainer = () => {
	const t = useTranslation();

	const { value: data, phase: state, error } = useEndpointData('livechat/integrations.settings');

	const canViewLivechatWebhooks = usePermission('view-livechat-webhooks');

	if (!canViewLivechatWebhooks) {
		return <NotAuthorizedPage />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return <PageSkeleton />;
	}

	if (!data || !data.success || !data.settings || error) {
		return (
			<Page>
				<Page.Header title={t('Webhooks')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	return <WebhooksPage settings={reduceSettings(data.settings)} />;
};

export default WebhooksPageContainer;
