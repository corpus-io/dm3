import { MessageIndicator, MessageModel } from '../../useMessage';

export const renderReadOpened = (messages: MessageModel[]) => {
    //We filter out all messages that are of type READ_OPENED
    const readOpenedMsgs = messages.filter(
        (message) => message.envelop.message.metadata.type === 'READ_OPENED',
    );

    const msgsWithoutReadType = messages.filter(
        (data) => data.envelop.message.metadata.type !== 'READ_OPENED',
    );

    //update indicator to the messages
    return msgsWithoutReadType.map((message) => {
        const openedMsg = readOpenedMsgs.find(
            (m) =>
                m.envelop.message.metadata.referenceMessageHash ===
                message.envelop.metadata?.messageHash,
        );
        return {
            ...message,
            indicator: openedMsg ? MessageIndicator.READED : message.indicator,
        };
    });
};
