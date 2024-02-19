import {
	Button,
	ButtonGroup,
	Icon,
	Field,
	FieldGroup,
	TextInput,
	Throbber,
} from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useState } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import Page from '../../../components/Page';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute, useQueryStringParameter } from '../../../contexts/RouterContext';
import { useEndpoint, useUpload } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import { useForm } from '../../../hooks/useForm';
import AppPermissionsReviewModal from './AppPermissionsReviewModal';
import AppUpdateModal from './AppUpdateModal';
import { handleInstallError } from './helpers';
import { getManifestFromZippedApp } from './lib/getManifestFromZippedApp';

const placeholderUrl = 'https://rocket.chat/apps/package.zip';

function AppInstallPage() {
	const t = useTranslation();

	const appsRoute = useRoute('admin-apps');
	const setModal = useSetModal();

	const appId = useQueryStringParameter('id');
	const queryUrl = useQueryStringParameter('url');

	const [installing, setInstalling] = useState(false);

	const endpointAddress = appId ? `/apps/${appId}` : '/apps';
	const downloadApp = useEndpoint('POST', endpointAddress);
	const uploadApp = useUpload(endpointAddress);
	const uploadUpdateApp = useUpload(`${endpointAddress}/update`);

	const { values, handlers } = useForm({
		file: {},
		url: queryUrl,
	});

	const { file, url } = values;

	const canSave = !!url || !!file.name;

	const { handleFile, handleUrl } = handlers;

	useEffect(() => {
		queryUrl && handleUrl(queryUrl);
	}, [queryUrl, handleUrl]);

	const [handleUploadButtonClick] = useFileInput(handleFile, 'app');

	const sendFile = async (permissionsGranted, appFile, appId) => {
		let app;
		const fileData = new FormData();
		fileData.append('app', appFile, appFile.name);
		fileData.append('permissions', JSON.stringify(permissionsGranted));

		if (appId) {
			await uploadUpdateApp(fileData);
		} else {
			app = await uploadApp(fileData);
		}

		appsRoute.push({ context: 'details', id: appId || app.app.id });
		setModal(null);
	};

	const cancelAction = useCallback(() => {
		setInstalling(false);
		setModal(null);
	}, [setInstalling, setModal]);

	const isAppInstalled = async (appId) => {
		try {
			const app = await Apps.getApp(appId);
			return !!app || false;
		} catch (e) {
			return false;
		}
	};

	const handleAppPermissionsReview = async (permissions, appFile, appId) => {
		if (!permissions || permissions.length === 0) {
			await sendFile(permissions, appFile, appId);
		} else {
			setModal(
				<AppPermissionsReviewModal
					appPermissions={permissions}
					cancel={cancelAction}
					confirm={(permissions) => sendFile(permissions, appFile, appId)}
				/>,
			);
		}
	};

	const install = async () => {
		setInstalling(true);

		try {
			let manifest;
			let appFile;
			if (url) {
				const { buff } = await downloadApp({ url, downloadOnly: true });
				const fileData = Uint8Array.from(buff.data);
				manifest = await getManifestFromZippedApp(fileData);
				appFile = new File([fileData], 'app.zip', { type: 'application/zip' });
			} else {
				appFile = file;
				manifest = await getManifestFromZippedApp(appFile);
			}

			const { permissions, id } = manifest;

			const isInstalled = await isAppInstalled(id);

			if (isInstalled) {
				setModal(
					<AppUpdateModal
						cancel={cancelAction}
						confirm={() => handleAppPermissionsReview(permissions, appFile, id)}
					/>,
				);
			} else {
				await handleAppPermissionsReview(permissions, appFile);
			}
		} catch (error) {
			handleInstallError(error);
		} finally {
			setInstalling(false);
		}
	};

	const handleCancel = () => {
		appsRoute.push();
	};

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('App_Installation')} />
			<Page.ScrollableContent>
				<FieldGroup
					display='flex'
					flexDirection='column'
					alignSelf='center'
					maxWidth='x600'
					w='full'
				>
					<Field>
						<Field.Label>{t('App_Url_to_Install_From')}</Field.Label>
						<Field.Row>
							<TextInput
								placeholder={placeholderUrl}
								value={url}
								onChange={handleUrl}
								addon={<Icon name='permalink' size='x20' />}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('App_Url_to_Install_From_File')}</Field.Label>
						<Field.Row>
							<TextInput
								value={file.name || ''}
								addon={
									<Button small primary onClick={handleUploadButtonClick} mb='neg-x4' mie='neg-x8'>
										<Icon name='upload' size='x12' />
										{t('Browse_Files')}
									</Button>
								}
							/>
						</Field.Row>
					</Field>
					<Field>
						<ButtonGroup>
							<Button disabled={!canSave || installing} onClick={install}>
								{!installing && t('Install')}
								{installing && <Throbber inheritColor />}
							</Button>
							<Button onClick={handleCancel}>{t('Cancel')}</Button>
						</ButtonGroup>
					</Field>
				</FieldGroup>
			</Page.ScrollableContent>
		</Page>
	);
}

export default AppInstallPage;
