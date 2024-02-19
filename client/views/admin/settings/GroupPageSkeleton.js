import { Accordion, Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import Section from './Section';

function GroupPageSkeleton() {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={<Skeleton style={{ width: '20rem' }} />}>
				<ButtonGroup>
					<Button children={t('Save_changes')} disabled primary />
				</ButtonGroup>
			</Page.Header>

			<Page.Content>
				<Box style={useMemo(() => ({ margin: '0 auto', width: '100%', maxWidth: '590px' }), [])}>
					<Box is='p' color='hint' fontScale='p1'>
						<Skeleton />
						<Skeleton />
						<Skeleton width='75%' />
					</Box>

					<Accordion className='page-settings'>
						<Section.Skeleton />
					</Accordion>
				</Box>
			</Page.Content>
		</Page>
	);
}

export default GroupPageSkeleton;
