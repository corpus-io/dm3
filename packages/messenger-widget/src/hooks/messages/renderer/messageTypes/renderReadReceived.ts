import { MessageIndicator, MessageModel } from '../../useMessage';

export const renderReadReceived = (messages: MessageModel[]) => {
    //We filter out all messages that are of type READ_RECEIVED
    const readReceivedMsgs = messages.filter(
        (message) => message.envelop.message.metadata.type === 'READ_RECEIVED',
    );

    const msgsWithoutReadType = messages.filter(
        (data) => data.envelop.message.metadata.type !== 'READ_RECEIVED',
    );

    //update indicator to the messages
    return msgsWithoutReadType.map((message) => {
        const receivedMsg = readReceivedMsgs.find(
            (m) =>
                m.envelop.message.metadata.referenceMessageHash ===
                message.envelop.metadata?.messageHash,
        );
        return {
            ...message,
            indicator: receivedMsg
                ? MessageIndicator.RECEIVED
                : MessageIndicator.SENT,
        };
    });
};
