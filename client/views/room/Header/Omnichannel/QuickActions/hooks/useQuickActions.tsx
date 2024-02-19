import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import React, { useCallback, useState, useEffect } from 'react';
import toastr from 'toastr';

import { RoomManager } from '../../../../../../../app/ui-utils/client';
import { IOmnichannelRoom } from '../../../../../../../definition/IRoom';
import PlaceChatOnHoldModal from '../../../../../../../ee/app/livechat-enterprise/client/components/modals/PlaceChatOnHoldModal';
import CloseChatModal from '../../../../../../components/Omnichannel/modals/CloseChatModal';
import CloseChatModalData from '../../../../../../components/Omnichannel/modals/CloseChatModalData';
import ForwardChatModal from '../../../../../../components/Omnichannel/modals/ForwardChatModal';
import ReturnChatQueueModal from '../../../../../../components/Omnichannel/modals/ReturnChatQueueModal';
import TranscriptModal from '../../../../../../components/Omnichannel/modals/TranscriptModal';
import { usePermission, useRole } from '../../../../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../../../../contexts/ModalContext';
import { useOmnichannelRouteConfig } from '../../../../../../contexts/OmnichannelContext';
import { useEndpoint, useMethod } from '../../../../../../contexts/ServerContext';
import { useSetting } from '../../../../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../contexts/TranslationContext';
import { useUserId } from '../../../../../../contexts/UserContext';
import { handleError } from '../../../../../../lib/utils/handleError';
import { QuickActionsActionConfig, QuickActionsEnum } from '../../../../lib/QuickActions';
import { useQuickActionsContext } from '../../../../lib/QuickActions/QuickActionsContext';

export const useQuickActions = (
	room: IOmnichannelRoom,
): {
	visibleActions: QuickActionsActionConfig[];
	actionDefault: (e: unknown) => void;
	getAction: (id: string) => void;
} => {
	const setModal = useSetModal();

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const context = useQuickActionsContext();
	const actions = (Array.from(context.actions.values()) as QuickActionsActionConfig[]).sort(
		(a, b) => (a.order || 0) - (b.order || 0),
	);

	const [onHoldModalActive, setOnHoldModalActive] = useState(false);

	const visitorRoomId = room.v._id;
	const rid = room._id;
	const uid = useUserId();
	const roomLastMessage = room.lastMessage;

	const getVisitorInfo = useEndpoint('GET', 'livechat/visitors.info');

	const getVisitorEmail = useMutableCallback(async () => {
		if (!visitorRoomId) {
			return;
		}

		const {
			visitor: { visitorEmails },
		} = await getVisitorInfo({ visitorId: visitorRoomId });

		if (visitorEmails?.length && visitorEmails[0].address) {
			return visitorEmails[0].address;
		}
	});

	useEffect(() => {
		if (onHoldModalActive && roomLastMessage?.token) {
			setModal(null);
		}
	}, [roomLastMessage, onHoldModalActive, setModal]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const closeOnHoldModal = useCallback(() => {
		closeModal();
		setOnHoldModalActive(false);
	}, [closeModal]);

	const methodReturn = useMethod('livechat:returnAsInquiry');

	const handleMoveChat = useCallback(async () => {
		try {
			await methodReturn(rid);
			closeModal();
			Session.set('openedRoom', null);
			FlowRouter.go('/home');
		} catch (error: any) {
			handleError(error);
		}
	}, [closeModal, methodReturn, rid]);

	const requestTranscript = useMethod('livechat:requestTranscript');

	const handleRequestTranscript = useCallback(
		async (email: string, subject: string) => {
			try {
				await requestTranscript(rid, email, subject);
				closeModal();
				RoomManager.close(`l${rid}`);
				toastr.success(t('Livechat_transcript_has_been_requested'));
			} catch (error: any) {
				handleError(error);
			}
		},
		[closeModal, requestTranscript, rid, t],
	);

	const sendTranscript = useMethod('livechat:sendTranscript');

	const handleSendTranscript = useCallback(
		async (email: string, subject: string, token: string) => {
			try {
				await sendTranscript(token, rid, email, subject);
				closeModal();
			} catch (error: any) {
				handleError(error);
			}
		},
		[closeModal, rid, sendTranscript],
	);

	const discardTranscript = useMethod('livechat:discardTranscript');

	const handleDiscardTranscript = useCallback(async () => {
		try {
			await discardTranscript(rid);
			toastr.success(t('Livechat_transcript_request_has_been_canceled'));
			closeModal();
		} catch (error: any) {
			handleError(error);
		}
	}, [closeModal, discardTranscript, rid, t]);

	const forwardChat = useMethod('livechat:transfer');

	const handleForwardChat = useCallback(
		async (departmentId?: string, userId?: string, comment?: string) => {
			if (departmentId && userId) {
				return;
			}
			const transferData: {
				roomId: string;
				clientAction: boolean;
				comment?: string;
				departmentId?: string;
				userId?: string;
			} = {
				roomId: rid,
				comment,
				clientAction: true,
			};

			if (departmentId) {
				transferData.departmentId = departmentId;
			}
			if (userId) {
				transferData.userId = userId;
			}

			try {
				const result = await forwardChat(transferData);
				if (!result) {
					throw new Error(
						departmentId ? t('error-no-agents-online-in-department') : t('error-forwarding-chat'),
					);
				}
				toastr.success(t('Transferred'));
				FlowRouter.go('/');
				closeModal();
			} catch (error: any) {
				handleError(error);
			}
		},
		[closeModal, forwardChat, rid, t],
	);

	const closeChat = useMethod('livechat:closeRoom');

	const handleClose = useCallback(
		async (comment: string, tags: string[]) => {
			try {
				await closeChat(rid, comment, { clientAction: true, tags });
				closeModal();
				toastr.success(t('Chat_closed_successfully'));
			} catch (error: any) {
				handleError(error);
			}
		},
		[closeChat, closeModal, rid, t],
	);

	const onHoldChat = useEndpoint('POST', 'livechat/room.onHold');

	const handleOnHoldChat = useCallback(async () => {
		try {
			await onHoldChat({ roomId: rid });
			closeModal();
			toastr.success(t('Chat_On_Hold_Successfully'));
		} catch (error: any) {
			handleError(error);
		}
	}, [onHoldChat, closeModal, rid, t]);

	const openModal = useMutableCallback(async (id: string) => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				setModal(<ReturnChatQueueModal onMoveChat={handleMoveChat} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.Transcript:
				const visitorEmail = await getVisitorEmail();

				if (!visitorEmail) {
					dispatchToastMessage({ type: 'error', message: t('Customer_without_registered_email') });
					break;
				}

				setModal(
					<TranscriptModal
						room={room}
						email={visitorEmail}
						onRequest={handleRequestTranscript}
						onSend={handleSendTranscript}
						onDiscard={handleDiscardTranscript}
						onCancel={closeModal}
					/>,
				);
				break;
			case QuickActionsEnum.ChatForward:
				setModal(
					<ForwardChatModal room={room} onForward={handleForwardChat} onCancel={closeModal} />,
				);
				break;
			case QuickActionsEnum.CloseChat:
				setModal(
					room.departmentId ? (
						<CloseChatModalData
							departmentId={room.departmentId}
							onConfirm={handleClose}
							onCancel={closeModal}
						/>
					) : (
						<CloseChatModal onConfirm={handleClose} onCancel={closeModal} />
					),
				);
				break;
			case QuickActionsEnum.OnHoldChat:
				setModal(
					<PlaceChatOnHoldModal onOnHoldChat={handleOnHoldChat} onCancel={closeOnHoldModal} />,
				);
				setOnHoldModalActive(true);
				break;
			default:
				break;
		}
	});

	const omnichannelRouteConfig = useOmnichannelRouteConfig();

	const manualOnHoldAllowed = useSetting('Livechat_allow_manual_on_hold');

	const hasManagerRole = useRole('livechat-manager');

	const roomOpen =
		room?.open &&
		(room.u?._id === uid || hasManagerRole) &&
		room?.lastMessage?.t !== 'livechat-close';
	const canMoveQueue = !!omnichannelRouteConfig?.returnQueue && room?.u !== undefined;
	const canForwardGuest = usePermission('transfer-livechat-guest');
	const canSendTranscript = usePermission('send-omnichannel-chat-transcript');
	const canCloseRoom = usePermission('close-livechat-room');
	const canCloseOthersRoom = usePermission('close-others-livechat-room');
	const canPlaceChatOnHold = Boolean(
		!room.onHold && room.u && !(room as any).lastMessage?.token && manualOnHoldAllowed,
	);

	const hasPermissionButtons = (id: string): boolean => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				return !!roomOpen && canMoveQueue;
			case QuickActionsEnum.ChatForward:
				return !!roomOpen && canForwardGuest;
			case QuickActionsEnum.Transcript:
				return canSendTranscript;
			case QuickActionsEnum.CloseChat:
				return !!roomOpen && (canCloseRoom || canCloseOthersRoom);
			case QuickActionsEnum.OnHoldChat:
				return !!roomOpen && canPlaceChatOnHold;
			default:
				break;
		}
		return false;
	};

	const visibleActions = actions.filter(({ id }) => hasPermissionButtons(id));

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-quick-actions');
		const { id } = visibleActions[index];
		openModal(id);
	});

	const getAction = useMutableCallback((id) => {
		openModal(id);
	});

	return { visibleActions, actionDefault, getAction };
};
