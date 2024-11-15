import {
    createReplyMessage,
    createEditMessage,
    createMessage,
} from '@dm3-org/dm3-lib-messaging';
import { MessageActionType } from '../../utils/enum-type-utils';
import { MessageAction, MessageDataProps } from '../../interfaces/props';
import { Account } from '@dm3-org/dm3-lib-profile';
import { AddMessage } from '../../hooks/messages/useMessage';
import { ContactPreview } from '../../interfaces/utils';
import { closeErrorModal, openErrorModal } from '../../utils/common-utils';
import { scrollToBottomOfChat } from '../Chat/scrollToBottomOfChat';

export const onSubmitMessage = async (
    messageView: MessageAction,
    setMessageView: (view: MessageAction) => void,
    setLastMessageAction: (action: MessageActionType) => void,
    addMessage: AddMessage,
    props: MessageDataProps,
    profileKeys: any,
    account: Account,
    selectedContact: ContactPreview,
) => {
    // Message can't be empty if no files are selected & its not DELETE msg.
    if (
        messageView.actionType !== MessageActionType.DELETE &&
        !props.filesSelected.length &&
        (!props.message || props.message.trim() === '')
    ) {
        return;
    }
    if (messageView.actionType === MessageActionType.REPLY) {
        const referenceMessageHash =
            messageView.messageData?.envelop.metadata?.messageHash;

        const messageData = await createReplyMessage(
            selectedContact?.contactDetails.account.ensName!,
            account!.ensName,
            props.message,
            profileKeys?.signingKeyPair.privateKey!,
            referenceMessageHash!,
            props.filesSelected,
        );

        const { error } = await addMessage(
            selectedContact?.contactDetails.account.ensName!,
            messageData,
        );

        if (error) {
            openErrorModal(error, false, closeErrorModal);
            return;
        }

        // Removes preview of reply to message in the UI
        setMessageView({
            actionType: MessageActionType.NONE,
            messageData: undefined,
        });

        props.setFiles([]);
        props.setMessageText('');

        setLastMessageAction(MessageActionType.REPLY);
        scrollToBottomOfChat();
        return;
    }
    if (messageView.actionType === MessageActionType.EDIT) {
        const referenceMessageHash =
            messageView.messageData?.envelop.metadata?.messageHash;

        // reply to the original message
        const messageData = await createEditMessage(
            selectedContact?.contactDetails.account.ensName!,
            account!.ensName,
            props.message,
            profileKeys!.signingKeyPair.privateKey,
            referenceMessageHash as string,
            props.filesSelected,
        );

        const { error } = await addMessage(
            selectedContact?.contactDetails.account.ensName!,
            messageData,
        );

        if (error) {
            openErrorModal(error, false, closeErrorModal);
            return;
        }

        setMessageView({
            actionType: MessageActionType.NONE,
            messageData: undefined,
        });

        props.setFiles([]);
        props.setMessageText('');
        setLastMessageAction(MessageActionType.EDIT);

        return;
    }

    const messageData = await createMessage(
        selectedContact?.contactDetails.account.ensName!,
        account!.ensName,
        props.message,
        profileKeys?.signingKeyPair.privateKey!,
        props.filesSelected,
    );

    const { error } = await addMessage(
        selectedContact?.contactDetails.account.ensName!,
        messageData,
    );

    if (error) {
        openErrorModal(error, false, closeErrorModal);
        return;
    }

    props.setFiles([]);
    props.setMessageText('');
    scrollToBottomOfChat();
};
