import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import BurgerBadge from './BurgerBadge';
import BurgerIcon from './BurgerIcon';

type BurgerMenuButtonProps = {
	open?: boolean;
	badge?: number | unknown;
	onClick: () => void;
};

const BurgerMenuButton = ({ open, badge, onClick }: BurgerMenuButtonProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box
			is='button'
			aria-label={open ? t('Close_menu') : t('Open_menu')}
			type='button'
			position='relative'
			marginInlineEnd='x8'
			className={css`
				cursor: pointer;
			`}
			onClick={onClick}
		>
			<BurgerIcon open={open} />
			{badge && <BurgerBadge>{badge}</BurgerBadge>}
		</Box>
	);
};

export default BurgerMenuButton;
