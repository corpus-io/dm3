import { MessageAction, MessageProps } from '../../interfaces/props';
import { IAttachmentPreview as AttachmentModel } from '../../interfaces/utils';
import {
    createNameForFile,
    generateRandomStringForId,
    getFileTypeFromBase64,
} from '../../utils/common-utils';
import { MessageActionType } from '../../utils/enum-type-utils';
import { isFileAImage } from '../MessageInputBox/bl';
import { Attachment } from '@dm3-org/dm3-lib-messaging';

export const scrollToMessage = (replyFromMessageId: string) => {
    const element = document.getElementById(replyFromMessageId) as HTMLElement;
    element && element.scrollIntoView();
};

export const getMessageChangeText = (props: MessageProps): string => {
    switch (props.envelop.message.metadata.type) {
        case 'EDIT':
            return '(edited) ';
        case 'DELETE_REQUEST':
            return '(deleted) ';
        default:
            return '';
    }
};

export const getFilesAttachments = (files: Attachment[]) => {
    const data: AttachmentModel[] = [];
    let fileType;
    files.forEach((file, index) => {
        //In case some attachments with the old spec are present.
        //In order to not break the download functionality, we need to check if the attachment has a data
        const attachmentData = file.data ?? file;
        fileType = getFileTypeFromBase64(attachmentData);
        data.push({
            id: generateRandomStringForId(),
            name: file.name ?? createNameForFile(index, fileType),
            data: attachmentData,
            isImage: isFileAImage(fileType),
        });
    });
    return data;
};

// returns the css classes based on message type
export const getMessageStyleClasses = (
    props: MessageProps,
    messageView: MessageAction,
    isOldMsgStyle: boolean,
): string => {
    return 'width-fill text-left border-radius-6 content-style'.concat(
        ' ',
        isOldMsgStyle ? 'old-content-style' : '',
        ' ',
        (props.ownMessage
            ? !props.message &&
              props.envelop.message.metadata.type ===
                  MessageActionType.DELETE &&
              (!props.envelop.message.attachments ||
                  props.envelop.message.attachments.length < 1)
                ? 'own-deleted-msg'
                : messageView.actionType === MessageActionType.EDIT &&
                  messageView.messageData?.envelop.message.signature ===
                      props.envelop.message.signature
                ? 'msg-editing-active'
                : 'own-msg-background own-msg-text'
            : !props.message &&
              props.envelop.message.metadata.type ===
                  MessageActionType.DELETE &&
              (!props.envelop.message.attachments ||
                  props.envelop.message.attachments.length < 1)
            ? 'contact-deleted-msg'
            : 'contact-msg-background contact-msg-text'
        ).concat(
            ' ',
            props.reactions.length > 0
                ? props.ownMessage
                    ? 'own-reacted-msg'
                    : isOldMsgStyle
                    ? 'old-contact-reacted-msg'
                    : 'contact-reacted-msg'
                : '',
        ),
    );
};

// returns the css classes based on the reactions
export const getMessageReactionStyleClassses = (
    props: MessageProps,
    isOldMsgType: boolean,
) => {
    return 'd-flex justify-content-end text-secondary-color time-style'.concat(
        ' ',
        props.reactions.length > 0
            ? isOldMsgType
                ? !props.ownMessage
                    ? 'justify-content-between'
                    : 'ms-3 justify-content-end'
                : ''
            : props.ownMessage
            ? 'ms-3'
            : '',
    );
};
