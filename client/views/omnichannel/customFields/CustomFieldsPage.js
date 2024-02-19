import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const CustomFieldsPage = ({ data, header, setParams, params, title, renderRow, children }) => {
	const t = useTranslation();

	const router = useRoute('omnichannel-customfields');

	const onAddNew = useMutableCallback(() => router.push({ context: 'new' }));

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<Button onClick={onAddNew}>
						<Icon name='plus' size='x16' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow}
						results={data && data.customFields}
						total={data && data.total}
						setParams={setParams}
						params={params}
						renderFilter={({ onChange, ...props }) => (
							<FilterByText onChange={onChange} {...props} />
						)}
					/>
				</Page.Content>
			</Page>
			{children}
		</Page>
	);
};

export default CustomFieldsPage;
