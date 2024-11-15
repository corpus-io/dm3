import { MessageModel } from '../../useMessage';

export const renderDuplicates = (messages: MessageModel[]) => {
    //Return messages without duplicates
    return messages.filter(
        (message, index, self) =>
            index ===
            self.findIndex(
                (t) =>
                    t.envelop.metadata?.messageHash ===
                    message.envelop.metadata?.messageHash,
            ),
    );
};
