import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const AppPermissionsReviewModal = ({ appPermissions, cancel, confirm, modalProps = {} }) => {
	const t = useTranslation();

	const handleCloseButtonClick = () => {
		cancel();
	};

	const handleCancelButtonClick = () => {
		cancel();
	};

	const handleConfirmButtonClick = () => {
		confirm(appPermissions);
	};

	return (
		<Modal {...modalProps}>
			<Modal.Header>
				<Icon color='warning' name='modal-warning' size={25} />
				<Modal.Title>{t('Apps_Permissions_Review_Modal_Title')}</Modal.Title>
				<Modal.Close onClick={handleCloseButtonClick} />
			</Modal.Header>
			<Modal.Content marginBlockEnd={20} fontScale='p1'>
				{t('Apps_Permissions_Review_Modal_Subtitle')}
			</Modal.Content>
			<Modal.Content fontScale='p1'>
				<ul>
					{appPermissions.length
						? appPermissions.map((permission, count) => (
								<li key={permission.name}>
									<b>{count + 1} - </b>
									{t(`Apps_Permissions_${permission.name.replace('.', '_')}`)}
									{permission.required && <span style={{ color: 'red' }}> ({t('required')})</span>}
								</li>
						  ))
						: t('Apps_Permissions_No_Permissions_Required')}
				</ul>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button ghost onClick={handleCancelButtonClick}>
						{t('Cancel')}
					</Button>
					<Button primary onClick={handleConfirmButtonClick}>
						{t('Agree')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default AppPermissionsReviewModal;
