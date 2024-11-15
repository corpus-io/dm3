import { Envelop, MessageState } from '@dm3-org/dm3-lib-messaging';
import { MessageActionType } from '../utils/enum-type-utils';
import { IAttachmentPreview, ContactPreview } from './utils';
import { MessageIndicator } from '../hooks/messages/useMessage';

export interface IEnsDetails {
    propertyKey: string;
    propertyValue: string;
    action?: Function;
}

export interface IContactMenu {
    contactDetails: ContactPreview;
    isMenuAlignedAtBottom: boolean;
}

export interface MessageProps {
    message: string;
    time: string;
    messageState: MessageState;
    ownMessage: boolean;
    envelop: Envelop;
    replyToMessageEnvelop?: Envelop | undefined;
    reactions: Envelop[];
    isLastMessage?: boolean;
    hideFunction?: string;
    indicator?: MessageIndicator;
    showProfile?: boolean;
    isFirstMsgOfDay?: boolean;
}

export interface MessageAction {
    messageData: MessageProps | undefined;
    actionType: MessageActionType;
}

export interface EmojiProps {
    message: string;
    setMessage: Function;
}

export interface ReplyMessagePreviewProps {
    setFiles: Function;
}

export interface AttachmentProps {
    filesSelected: IAttachmentPreview[];
    setFiles: Function;
}

export interface MessageDataProps {
    message: string;
    filesSelected: IAttachmentPreview[];
    setFiles: Function;
    setMessageText: Function;
}

export interface AttachmentPreviewProps {
    filesSelected: IAttachmentPreview[];
    isMyMessage: boolean;
    isReplyMsgAttachments?: boolean;
}

export interface ImageModal {
    uri: string;
    setUri: Function;
}

export interface DeleteDM3NameProps {
    setDeleteDM3NameConfirmation: Function;
    removeDm3Name: Function;
}
