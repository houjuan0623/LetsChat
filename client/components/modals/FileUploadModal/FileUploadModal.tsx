import {
	Modal,
	Box,
	Field,
	FieldGroup,
	TextInput,
	ButtonGroup,
	Button,
} from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, {
	ReactElement,
	memo,
	useState,
	ChangeEvent,
	FormEventHandler,
	useEffect,
} from 'react';

import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import FilePreview from './FilePreview';

type FilePreviewModalProps = {
	onClose: () => void;
	onSubmit: (name: string, description?: string) => void;
	file: File;
	fileName: string;
	isValidContentType: boolean;
};

const FilePreviewModal = ({
	onClose,
	file,
	fileName,
	onSubmit,
	isValidContentType,
}: FilePreviewModalProps): ReactElement => {
	const [name, setName] = useState<string>(fileName);
	const [description, setDescription] = useState<string>('');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const ref = useAutoFocus();

	const handleName = (e: ChangeEvent<HTMLInputElement>): void => {
		setName(e.currentTarget.value);
	};

	const handleDescription = (e: ChangeEvent<HTMLInputElement>): void => {
		setDescription(e.currentTarget.value);
	};

	const handleSubmit: FormEventHandler<HTMLFormElement> = (e): void => {
		e.preventDefault();
		if (!name) {
			return dispatchToastMessage({
				type: 'error',
				message: t('error-the-field-is-required', { field: t('Name') }),
			});
		}
		onSubmit(name, description);
	};

	useEffect(() => {
		if (!isValidContentType) {
			dispatchToastMessage({
				type: 'error',
				message: t('FileUpload_MediaType_NotAccepted__type__', { type: file.type }),
			});
			onClose();
			return;
		}

		if (file.size === 0) {
			dispatchToastMessage({
				type: 'error',
				message: t('FileUpload_File_Empty'),
			});
			onClose();
		}
	}, [file, dispatchToastMessage, isValidContentType, t, onClose]);

	return (
		<Modal>
			<Box is='form' display='flex' flexDirection='column' height='100%' onSubmit={handleSubmit}>
				<Modal.Header>
					<Modal.Title>{t('FileUpload')}</Modal.Title>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content overflow='hidden'>
					<Box
						display='flex'
						maxHeight='x360'
						w='full'
						justifyContent='center'
						alignContent='center'
						mbe='x16'
					>
						<FilePreview file={file} />
					</Box>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Upload_file_name')}</Field.Label>
							<Field.Row>
								<TextInput value={name} onChange={handleName} />
							</Field.Row>
							{!name && (
								<Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>
							)}
						</Field>
						<Field>
							<Field.Label>{t('Upload_file_description')}</Field.Label>
							<Field.Row>
								<TextInput
									value={description}
									onChange={handleDescription}
									placeholder={t('Description')}
									ref={ref}
								/>
							</Field.Row>
						</Field>
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						<Button ghost onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' disabled={!name}>
							{t('Send')}
						</Button>
					</ButtonGroup>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(FilePreviewModal);
