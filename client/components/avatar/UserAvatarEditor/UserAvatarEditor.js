import { Box, Button, Icon, TextInput, Margins, Avatar } from '@rocket.chat/fuselage';
import React, { useState, useCallback } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import UserAvatar from '../UserAvatar';
import UserAvatarSuggestions from './UserAvatarSuggestions';

function UserAvatarEditor({
	currentUsername,
	username,
	setAvatarObj,
	suggestions,
	disabled,
	etag,
}) {
	const t = useTranslation();
	const [avatarFromUrl, setAvatarFromUrl] = useState('');
	const [newAvatarSource, setNewAvatarSource] = useState();
	const [urlEmpty, setUrlEmpty] = useState(true);

	const setUploadedPreview = useCallback(
		async (file, avatarObj) => {
			setAvatarObj(avatarObj);
			setNewAvatarSource(URL.createObjectURL(file));
		},
		[setAvatarObj],
	);

	const [clickUpload] = useFileInput(setUploadedPreview);

	const clickUrl = () => {
		if (avatarFromUrl === '') {
			return;
		}
		setNewAvatarSource(avatarFromUrl);
		setAvatarObj({ avatarUrl: avatarFromUrl });
	};
	const clickReset = () => {
		setNewAvatarSource(`/avatar/%40${username}`);
		setAvatarObj('reset');
	};

	const url = newAvatarSource;

	const handleAvatarFromUrlChange = (event) => {
		event.currentTarget.value !== '' ? setUrlEmpty(false) : setUrlEmpty(true);
		setAvatarFromUrl(event.currentTarget.value);
	};

	return (
		<Box display='flex' flexDirection='column' fontScale='p2'>
			{t('Profile_picture')}
			<Box display='flex' flexDirection='row' mbs='x4'>
				<UserAvatar
					size='x124'
					url={url}
					username={currentUsername}
					etag={etag}
					style={{ objectFit: 'contain' }}
					mie='x4'
				/>
				<Box
					display='flex'
					flexDirection='column'
					flexGrow='1'
					justifyContent='space-between'
					mis='x4'
				>
					<Box display='flex' flexDirection='row' mbs='none'>
						<Margins inline='x4'>
							<Button
								square
								mis='none'
								onClick={clickReset}
								disabled={disabled}
								mie='x4'
								title={t('Accounts_SetDefaultAvatar')}
							>
								<Avatar url={`/avatar/%40${username}`} />
							</Button>
							<Button square onClick={clickUpload} disabled={disabled} title={t('Upload')}>
								<Icon name='upload' size='x20' />
							</Button>
							<Button
								square
								mie='none'
								onClick={clickUrl}
								disabled={disabled || urlEmpty}
								title={t('Add URL')}
							>
								<Icon name='permalink' size='x20' />
							</Button>
							{suggestions && (
								<UserAvatarSuggestions
									suggestions={suggestions}
									setAvatarObj={setAvatarObj}
									setNewAvatarSource={setNewAvatarSource}
									disabled={disabled}
								/>
							)}
						</Margins>
					</Box>
					<Margins inlineStart='x4'>
						<Box>{t('Use_url_for_avatar')}</Box>
						<TextInput
							flexGrow={0}
							placeholder={t('Use_url_for_avatar')}
							value={avatarFromUrl}
							onChange={handleAvatarFromUrlChange}
						/>
					</Margins>
				</Box>
			</Box>
		</Box>
	);
}

export default UserAvatarEditor;
