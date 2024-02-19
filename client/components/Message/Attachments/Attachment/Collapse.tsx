import React, { ComponentProps, FC } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import Action from './Action';

const Collapse: FC<Omit<ComponentProps<typeof Action>, 'icon'> & { collapsed?: boolean }> = ({
	collapsed = false,
	...props
}) => {
	const t = useTranslation();
	return (
		<Action
			title={collapsed ? t('Uncollapse') : t('Collapse')}
			icon={!collapsed ? 'chevron-down' : 'chevron-left'}
			{...props}
		/>
	);
};

export default Collapse;
