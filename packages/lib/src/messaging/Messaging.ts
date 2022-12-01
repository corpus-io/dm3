import { Account, ProfileKeys } from '../account/Account';
import { decryptAsymmetric, EncryptAsymmetric, sign } from '../crypto';
import {
    CreatePendingEntry,
    GetNewMessages,
    SubmitMessage,
} from '../external-apis/BackendAPI';
import { stringify } from '../shared/stringify';
import { log } from '../shared/log';
import {
    getConversation,
    StorageEnvelopContainer,
    UserDB,
} from '../storage/Storage';
import { Connection } from '../web3-provider/Web3Provider';
import { getDeliveryServiceProfile } from '../delivery';
import axios from 'axios';

export interface Message {
    to: string;
    from: string;
    timestamp: number;
    message: string;
    type: MessageType;
    referenceMessageHash?: string;
    attachments?: string[];
    replyDeliveryInstruction?: string;
    signature: string;
}

export type MessageType =
    | 'NEW'
    | 'DELETE_REQUEST'
    | 'EDIT'
    | 'REPLY'
    | 'REACTION'
    | 'READ_RECEIPT'
    | 'RESEND_REQUEST';

export interface Envelop {
    message: Message;
    signature: string;
    id?: string;
}

export interface Postmark {
    messageHash: string;
    incommingTimestamp: number;
    signature: string;
}

export interface DeliveryInformation {
    to: string;
    from: string;
    deliveryInstruction?: string;
}

export interface EncryptionEnvelop {
    encryptionVersion: 'x25519-chacha20-poly1305';
    message: string;
    deliveryInformation: string;
    postmark?: string;
}

export enum MessageState {
    Created,
    Signed,
    Send,
    Read,
    FailedToSend,
}

export function createMessage(
    to: string,
    from: string,
    message: string,
    getTimestamp: () => number,
    type: MessageType,
    signature: string,
    referenceMessageHash?: string,
    attachments?: string[],
    replyDeliveryInstruction?: string,
): Message {
    return {
        to,
        from,
        timestamp: getTimestamp(),
        message,
        type,
        referenceMessageHash,
        signature,
        attachments,
        replyDeliveryInstruction,
    };
}

export async function submitMessage(
    connection: Connection,
    deliveryServiceToken: string,
    userDb: UserDB,
    to: Account,
    message: Message,
    deliveryServiceEncryptionPubKey: string,
    submitMessageApi: SubmitMessage,
    encryptAsymmetric: EncryptAsymmetric,
    createPendingEntry: CreatePendingEntry,
    haltDelivery: boolean,
    storeMessages: (envelops: StorageEnvelopContainer[]) => void,
    onSuccess?: (envelop: Envelop) => void,
) {
    log('Submitting message');

    const innerEnvelop: Envelop = {
        message,
        signature: await sign(
            (userDb?.keys as ProfileKeys).signingKeyPair.privateKey,
            stringify(message),
        ),
    };

    const allOnSuccess = () => {
        if (onSuccess) {
            onSuccess(innerEnvelop);
        }
    };

    await createPendingEntry(
        connection,
        deliveryServiceToken,
        innerEnvelop.message.from,
        innerEnvelop.message.to,
    );

    if (haltDelivery) {
        log('- Halt delivery');
        storeMessages([
            { envelop: innerEnvelop, messageState: MessageState.Created },
        ]);
    } else {
        if (!to.profile) {
            throw Error('Contact has no profile');
        }

        const deliveryInformation: DeliveryInformation = {
            to: to.address,
            from: (connection.account as Account).address,
        };
        const envelop: EncryptionEnvelop = {
            message: stringify(
                await encryptAsymmetric(
                    to.profile.publicEncryptionKey,
                    stringify(innerEnvelop),
                ),
            ),
            deliveryInformation: stringify(
                await encryptAsymmetric(
                    deliveryServiceEncryptionPubKey,
                    stringify(deliveryInformation),
                ),
            ),
            encryptionVersion: 'x25519-chacha20-poly1305',
        };
        await submitMessageApi(
            connection,
            deliveryServiceToken,
            envelop,
            allOnSuccess,
            () => log('submit message error'),
        );

        storeMessages([
            { envelop: innerEnvelop, messageState: MessageState.Send },
        ]);
        log('- Message sent');
    }
}

async function decryptMessages(
    envelops: EncryptionEnvelop[],
    userDb: UserDB,
): Promise<Envelop[]> {
    return Promise.all(
        envelops.map(
            async (envelop): Promise<Envelop> =>
                JSON.parse(
                    await decryptAsymmetric(
                        userDb.keys.encryptionKeyPair,
                        JSON.parse(envelop.message),
                    ),
                ),
        ),
    );
}

export async function getMessages(
    connection: Connection,
    deliveryServiceToken: string,
    contact: string,
    getNewMessages: GetNewMessages,
    storeMessages: (envelops: StorageEnvelopContainer[]) => void,
    userDb: UserDB,
): Promise<StorageEnvelopContainer[]> {
    const profile = connection.account?.profile;

    if (!profile) {
        throw 'Account has no profile';
    }
    //Fetch evey delivery service's profie
    const deliveryServices = await Promise.all(
        profile.deliveryServices.map(async (ds) => {
            const deliveryServiceProfile = await getDeliveryServiceProfile(
                ds,
                connection,
                async (url) => (await axios.get(url)).data,
            );
            return deliveryServiceProfile?.url;
        }),
    );

    //Filter every deliveryService without an url
    const deliveryServiceUrls = deliveryServices.filter(
        (ds): ds is string => !!ds,
    );

    //Fetch messages from each deliveryService
    const messages = await Promise.all(
        deliveryServiceUrls.map(async (baseUrl) => {
            return await getNewMessages(
                connection,
                deliveryServiceToken,
                contact,
                baseUrl,
            );
        }),
    );

    //Flatten the message arrays of each delivery service to one message array
    const allMessages = messages.reduce((agg, cur) => [...agg, ...cur]);

    const envelops = await Promise.all(
        allMessages.map(async (envelop): Promise<StorageEnvelopContainer> => {
            const decryptedEnvelop = await decryptMessages([envelop], userDb);
            const decryptedPostmark = JSON.parse(
                await decryptAsymmetric(
                    userDb.keys.encryptionKeyPair,
                    JSON.parse(envelop.postmark!),
                ),
            );

            return {
                envelop: decryptedEnvelop[0],
                messageState: MessageState.Send,
                deliveryServiceIncommingTimestamp:
                    decryptedPostmark.incommingTimestamp,
            };
        }),
    );

    storeMessages(envelops);

    return getConversation(contact, connection, userDb);
}
