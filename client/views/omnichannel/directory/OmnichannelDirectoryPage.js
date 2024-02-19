import { Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useCallback, useState } from 'react';

import Page from '../../../components/Page';
import { useCurrentRoute, useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import ContextualBar from './ContextualBar';
import ChatTab from './chats/ChatTab';
import ContactTab from './contacts/ContactTab';

const OmnichannelDirectoryPage = () => {
	const defaultTab = 'contacts';

	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('page');
	const directoryRoute = useRoute('omnichannel-directory');

	useEffect(() => {
		if (routeName !== 'omnichannel-directory') {
			return;
		}

		if (!tab) {
			return directoryRoute.replace({ page: defaultTab });
		}
	}, [routeName, directoryRoute, tab, defaultTab]);

	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [directoryRoute]);

	const [contactReload, setContactReload] = useState();
	const [chatReload, setChatReload] = useState();

	const t = useTranslation();

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Omnichannel_Contact_Center')} />
				<Tabs flexShrink={0}>
					<Tabs.Item selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>
						{t('Contacts')}
					</Tabs.Item>
					<Tabs.Item selected={tab === 'chats'} onClick={handleTabClick('chats')}>
						{t('Chats')}
					</Tabs.Item>
				</Tabs>
				<Page.Content>
					{(tab === 'contacts' && <ContactTab setContactReload={setContactReload} />) ||
						(tab === 'chats' && <ChatTab setChatReload={setChatReload} />)}
				</Page.Content>
			</Page>
			<ContextualBar chatReload={chatReload} contactReload={contactReload} />
		</Page>
	);
};

export default OmnichannelDirectoryPage;
