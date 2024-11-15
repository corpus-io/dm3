import { Envelop, Message, Postmark } from '@dm3-org/dm3-lib-messaging';
import { sha256, stringify } from '@dm3-org/dm3-lib-shared';

export function makeEnvelop(
    from: string,
    to: string,
    msg: string,
    timestamp: number = 0,
) {
    const message: Message = {
        metadata: {
            to,
            from,
            timestamp,
            type: 'NEW',
        },
        message: msg,
        signature: '',
    };

    const postmark: Postmark = {
        messageHash: sha256(stringify(message)),
        incommingTimestamp: 0,
        signature: '',
    };

    const envelop: Envelop = {
        message,
        postmark,
        metadata: {
            deliveryInformation: {
                from: '',
                to: '',
                deliveryInstruction: '',
            },
            messageHash: '',
            version: '',
            encryptionScheme: '',
            signature: '',
        },
    };

    return envelop;
}

export const sign = async (data: string) => sha256(data);
export const testEnvelop = makeEnvelop('from1', 'to1', 'message', Date.now());
