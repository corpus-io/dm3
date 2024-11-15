import { MessageActionType } from '../../../../utils/enum-type-utils';
import { MessageModel } from '../../useMessage';
import { MessageType } from '@dm3-org/dm3-lib-messaging';

export const renderDelete = (messages: MessageModel[]) => {
    //We filter out all messages that are deleted
    const deleteMessages = messages.filter(
        (message) => message.envelop.message.metadata.type === 'DELETE_REQUEST',
    );

    //We get the message hash of the messages that are to be deleted
    const toBeDeletedByMessageHash = deleteMessages.map(
        (deleteMessage) =>
            deleteMessage.envelop.message.metadata.referenceMessageHash,
    );

    //We return the messages with out messages that are to be deleted and the delete requests
    return messages
        .filter(
            (message) =>
                message.envelop.message.metadata.type !==
                MessageActionType.DELETE,
        )
        .map((message) => {
            if (
                toBeDeletedByMessageHash.includes(
                    message.envelop.metadata?.messageHash,
                )
            ) {
                return {
                    ...message,
                    envelop: {
                        ...message.envelop,
                        message: {
                            ...message.envelop.message,
                            message: '',
                            metadata: {
                                ...message.envelop.message.metadata,
                                // REACT messages are set, so that it can be filtered out
                                // to be not shown on UI
                                type:
                                    message.envelop.message.metadata.type ===
                                    MessageActionType.REACT
                                        ? (MessageActionType.REACT as MessageType)
                                        : (MessageActionType.DELETE as MessageType),
                            },
                        },
                    },
                };
            }
            return message;
            // filter out all the reaction messages those are deleted
            // its not to be shown on UI
        })
        .filter(
            (messageData) =>
                !(
                    messageData.envelop.message.message === '' &&
                    messageData.envelop.message.metadata.type ===
                        MessageActionType.REACT
                ),
        );
};
