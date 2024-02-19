import {
	Field,
	FieldGroup,
	TextInput,
	TextAreaInput,
	Box,
	Icon,
	AnimatedVisibility,
	PasswordInput,
	Button,
	Grid,
	Margins,
} from '@rocket.chat/fuselage';
import { useDebouncedCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useEffect, useState } from 'react';

import { isEmail } from '../../../app/utils/lib/isEmail.js';
import { getUserEmailAddress } from '../../../lib/getUserEmailAddress';
import CustomFieldsForm from '../../components/CustomFieldsForm';
import UserStatusMenu from '../../components/UserStatusMenu';
import UserAvatarEditor from '../../components/avatar/UserAvatarEditor';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

const STATUS_TEXT_MAX_LENGTH = 120;

function AccountProfileForm({ values, handlers, user, settings, onSaveStateChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const checkUsernameAvailability = useMethod('checkUsernameAvailability');
	const getAvatarSuggestions = useMethod('getAvatarSuggestion');
	const sendConfirmationEmail = useMethod('sendConfirmationEmail');

	const [usernameError, setUsernameError] = useState();
	const [avatarSuggestions, setAvatarSuggestions] = useSafely(useState());

	const {
		allowRealNameChange,
		allowUserStatusMessageChange,
		allowEmailChange,
		allowPasswordChange,
		allowUserAvatarChange,
		canChangeUsername,
		namesRegex,
		requireName,
	} = settings;

	const {
		realname,
		email,
		username,
		password,
		confirmationPassword,
		statusText,
		bio,
		statusType,
		customFields,
		nickname,
	} = values;

	const {
		handleRealname,
		handleEmail,
		handleUsername,
		handlePassword,
		handleConfirmationPassword,
		handleAvatar,
		handleStatusText,
		handleStatusType,
		handleBio,
		handleCustomFields,
		handleNickname,
	} = handlers;

	const previousEmail = getUserEmailAddress(user);

	const handleSendConfirmationEmail = useCallback(async () => {
		if (email !== previousEmail) {
			return;
		}
		try {
			await sendConfirmationEmail(email);
			dispatchToastMessage({ type: 'success', message: t('Verification_email_sent') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, email, previousEmail, sendConfirmationEmail, t]);

	const passwordError = useMemo(
		() =>
			!password || !confirmationPassword || password === confirmationPassword
				? undefined
				: t('Passwords_do_not_match'),
		[t, password, confirmationPassword],
	);
	const emailError = useMemo(
		() => (isEmail(email) ? undefined : 'error-invalid-email-address'),
		[email],
	);
	const checkUsername = useDebouncedCallback(
		async (username) => {
			if (user.username === username) {
				return setUsernameError(undefined);
			}
			if (!namesRegex.test(username)) {
				return setUsernameError(t('error-invalid-username'));
			}
			const isAvailable = await checkUsernameAvailability(username);
			if (!isAvailable) {
				return setUsernameError(t('Username_already_exist'));
			}
			setUsernameError(undefined);
		},
		400,
		[namesRegex, t, user.username, checkUsernameAvailability, setUsernameError],
	);

	useEffect(() => {
		const getSuggestions = async () => {
			const suggestions = await getAvatarSuggestions();
			setAvatarSuggestions(suggestions);
		};
		getSuggestions();
	}, [getAvatarSuggestions, setAvatarSuggestions]);

	useEffect(() => {
		checkUsername(username);
	}, [checkUsername, username]);

	useEffect(() => {
		if (!password) {
			handleConfirmationPassword('');
		}
	}, [password, handleConfirmationPassword]);

	const nameError = useMemo(() => {
		if (user.name === realname) {
			return undefined;
		}
		if (!realname && requireName) {
			return t('Field_required');
		}
	}, [realname, requireName, t, user.name]);

	const statusTextError = useMemo(
		() =>
			!statusText || statusText.length <= STATUS_TEXT_MAX_LENGTH || statusText.length === 0
				? undefined
				: t('Max_length_is', STATUS_TEXT_MAX_LENGTH),
		[statusText, t],
	);
	const {
		emails: [{ verified = false } = { verified: false }],
	} = user;

	const canSave = !![
		!!passwordError,
		!!emailError,
		!!usernameError,
		!!nameError,
		!!statusTextError,
	].filter(Boolean);

	useEffect(() => {
		onSaveStateChange(canSave);
	}, [canSave, onSaveStateChange]);

	const handleSubmit = useCallback((e) => {
		e.preventDefault();
	}, []);

	return (
		<FieldGroup is='form' autoComplete='off' onSubmit={handleSubmit} {...props}>
			{useMemo(
				() => (
					<Field>
						<UserAvatarEditor
							etag={user.avatarETag}
							currentUsername={user.username}
							username={username}
							setAvatarObj={handleAvatar}
							disabled={!allowUserAvatarChange}
							suggestions={avatarSuggestions}
						/>
					</Field>
				),
				[
					username,
					user.username,
					handleAvatar,
					allowUserAvatarChange,
					avatarSuggestions,
					user.avatarETag,
				],
			)}
			<Box display='flex' flexDirection='row' justifyContent='space-between'>
				{useMemo(
					() => (
						<Field mie='x8' flexShrink={1}>
							<Field.Label flexGrow={0}>{t('Name')}</Field.Label>
							<Field.Row>
								<TextInput
									error={nameError}
									disabled={!allowRealNameChange}
									flexGrow={1}
									value={realname}
									onChange={handleRealname}
								/>
							</Field.Row>
							{!allowRealNameChange && <Field.Hint>{t('RealName_Change_Disabled')}</Field.Hint>}
							<Field.Error>{nameError}</Field.Error>
						</Field>
					),
					[t, realname, handleRealname, allowRealNameChange, nameError],
				)}
				{useMemo(
					() => (
						<Field mis='x8' flexShrink={1}>
							<Field.Label flexGrow={0}>{t('Username')}</Field.Label>
							<Field.Row>
								<TextInput
									error={usernameError}
									disabled={!canChangeUsername}
									flexGrow={1}
									value={username}
									onChange={handleUsername}
									addon={<Icon name='at' size='x20' />}
								/>
							</Field.Row>
							{!canChangeUsername && <Field.Hint>{t('Username_Change_Disabled')}</Field.Hint>}
							<Field.Error>{usernameError}</Field.Error>
						</Field>
					),
					[t, username, handleUsername, canChangeUsername, usernameError],
				)}
			</Box>
			{useMemo(
				() => (
					<Field>
						<Field.Label>{t('StatusMessage')}</Field.Label>
						<Field.Row>
							<TextInput
								error={statusTextError}
								disabled={!allowUserStatusMessageChange}
								flexGrow={1}
								value={statusText}
								onChange={handleStatusText}
								addon={
									<UserStatusMenu
										margin='neg-x2'
										onChange={handleStatusType}
										initialStatus={statusType}
									/>
								}
							/>
						</Field.Row>
						{!allowUserStatusMessageChange && (
							<Field.Hint>{t('StatusMessage_Change_Disabled')}</Field.Hint>
						)}
						<Field.Error>{statusTextError}</Field.Error>
					</Field>
				),
				[
					t,
					statusTextError,
					allowUserStatusMessageChange,
					statusText,
					handleStatusText,
					handleStatusType,
					statusType,
				],
			)}
			{useMemo(
				() => (
					<Field>
						<Field.Label>{t('Nickname')}</Field.Label>
						<Field.Row>
							<TextInput
								flexGrow={1}
								value={nickname}
								onChange={handleNickname}
								addon={<Icon name='edit' size='x20' alignSelf='center' />}
							/>
						</Field.Row>
					</Field>
				),
				[nickname, handleNickname, t],
			)}
			{useMemo(
				() => (
					<Field>
						<Field.Label>{t('Bio')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								flexGrow={1}
								value={bio}
								onChange={handleBio}
								addon={<Icon name='edit' size='x20' alignSelf='center' />}
							/>
						</Field.Row>
					</Field>
				),
				[bio, handleBio, t],
			)}
			<Field>
				<Grid>
					<Grid.Item>
						<FieldGroup display='flex' flexDirection='column' flexGrow={1} flexShrink={0}>
							{useMemo(
								() => (
									<Field>
										<Field.Label>{t('Email')}</Field.Label>
										<Field.Row>
											<TextInput
												flexGrow={1}
												value={email}
												error={emailError}
												onChange={handleEmail}
												addon={<Icon name={verified ? 'circle-check' : 'mail'} size='x20' />}
												disabled={!allowEmailChange}
											/>
										</Field.Row>
										{!allowEmailChange && <Field.Hint>{t('Email_Change_Disabled')}</Field.Hint>}
										<Field.Error>{t(emailError)}</Field.Error>
									</Field>
								),
								[t, email, handleEmail, verified, allowEmailChange, emailError],
							)}
							{useMemo(
								() =>
									!verified && (
										<Field>
											<Margins blockEnd='x28'>
												<Button
													disabled={email !== previousEmail}
													onClick={handleSendConfirmationEmail}
												>
													{t('Resend_verification_email')}
												</Button>
											</Margins>
										</Field>
									),
								[verified, t, email, previousEmail, handleSendConfirmationEmail],
							)}
						</FieldGroup>
					</Grid.Item>
					<Grid.Item>
						<FieldGroup display='flex' flexDirection='column' flexGrow={1} flexShrink={0}>
							{useMemo(
								() => (
									<Field>
										<Field.Label>{t('Password')}</Field.Label>
										<Field.Row>
											<PasswordInput
												autoComplete='off'
												disabled={!allowPasswordChange}
												error={passwordError}
												flexGrow={1}
												value={password}
												onChange={handlePassword}
												addon={<Icon name='key' size='x20' />}
											/>
										</Field.Row>
										{!allowPasswordChange && (
											<Field.Hint>{t('Password_Change_Disabled')}</Field.Hint>
										)}
									</Field>
								),
								[t, password, handlePassword, passwordError, allowPasswordChange],
							)}
							{useMemo(
								() => (
									<Field>
										<AnimatedVisibility
											visibility={password ? AnimatedVisibility.VISIBLE : AnimatedVisibility.HIDDEN}
										>
											<Field.Label>{t('Confirm_password')}</Field.Label>
											<Field.Row>
												<PasswordInput
													autoComplete='off'
													error={passwordError}
													flexGrow={1}
													value={confirmationPassword}
													onChange={handleConfirmationPassword}
													addon={<Icon name='key' size='x20' />}
												/>
											</Field.Row>
											{passwordError && <Field.Error>{passwordError}</Field.Error>}
										</AnimatedVisibility>
									</Field>
								),
								[t, confirmationPassword, handleConfirmationPassword, password, passwordError],
							)}
						</FieldGroup>
					</Grid.Item>
				</Grid>
			</Field>
			<CustomFieldsForm customFieldsData={customFields} setCustomFieldsData={handleCustomFields} />
		</FieldGroup>
	);
}

export default AccountProfileForm;
