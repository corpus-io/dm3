import { ethers } from 'ethers';
import stringify from 'safe-stable-stringify';

import { formatAddress } from '../external-apis/InjectedWeb3API';
import { EncryptionEnvelop, Postmark } from '../messaging/Messaging';
import { encryptAsymmetric, EncryptedPayload, sign } from '../crypto';
import { sha256 } from '../shared/sha256';
import { getConversationId } from '../storage/Storage';
import { checkToken, Session } from './Session';
import { log } from '../shared/log';

export interface Acknoledgment {
    contactAddress: string;
    messageDeliveryServiceTimestamp: number;
}

// fetch new messages
export async function getMessages(
    loadMessages: (
        conversationId: string,
        offset: number,
        size: number,
    ) => Promise<EncryptionEnvelop[]>,
    accountAddress: string,
    contactAddress: string,
) {
    const account = formatAddress(accountAddress);
    const contact = formatAddress(contactAddress);
    const conversationId = getConversationId(contact, account);

    const receivedMessages: EncryptionEnvelop[] = await loadMessages(
        conversationId,
        0,
        50,
    );

    const messages = receivedMessages.filter(
        (envelop) => formatAddress(envelop.to) === account,
    );

    return messages;
}

// buffer message until delivery and sync acknoledgment
export async function incomingMessage(
    { envelop, token }: { envelop: EncryptionEnvelop; token: string },
    deliveryServicePrivateKey: string,
    sizeLimit: number,
    getSession: (accountAddress: string) => Promise<Session | null>,
    storeNewMessage: (
        conversationId: string,
        envelop: EncryptionEnvelop,
    ) => Promise<void>,
    send: (socketId: string, envelop: EncryptionEnvelop) => void,
): Promise<void> {
    const sender = formatAddress(envelop.from);
    const receiver = formatAddress(envelop.to);
    const conversationId = getConversationId(sender, receiver);

    const tokenIsValid = await checkToken(getSession, sender, token);
    if (!tokenIsValid) {
        //Token is invalid
        throw Error('Token check failed');
    }

    const receiverSession = await getSession(receiver);
    if (receiverSession === null) {
        throw Error('unknown session');
    }

    if (messageIsToLarge(envelop, sizeLimit)) {
        throw Error('Message is too large');
    }

    const receiverEncryptionKey =
        receiverSession?.signedUserProfile.profile.publicEncryptionKey;

    const envelopWithPostmark: EncryptionEnvelop = {
        ...envelop,
        postmark: stringify(
            await addPostmark(
                envelop,
                receiverEncryptionKey,
                deliveryServicePrivateKey,
            ),
        ),
    };
    await storeNewMessage(conversationId, envelopWithPostmark);

    if (receiverSession?.socketId) {
        //Client is already connect to the delivery service and the message can be dispatched
        send(receiverSession.socketId, envelopWithPostmark);
    }
}

function messageIsToLarge(
    envelop: EncryptionEnvelop,
    sizeLimit: number,
): boolean {
    return Buffer.byteLength(JSON.stringify(envelop), 'utf-8') > sizeLimit;
}

async function addPostmark(
    { encryptedData }: EncryptionEnvelop,
    receiverEncryptionKey: string,
    deliveryServiceSigningKey: string,
): Promise<EncryptedPayload> {
    const postmarkWithoutSig: Omit<Postmark, 'signature'> = {
        messageHash: ethers.utils.hashMessage(stringify(encryptedData)),
        incommingTimestamp: new Date().getTime(),
    };

    const signature = await signPostmark(
        postmarkWithoutSig,
        deliveryServiceSigningKey,
    );

    //Encrypte the signed Postmark and return the ciphertext
    const { ciphertext, nonce, ephemPublicKey } = await encryptAsymmetric(
        receiverEncryptionKey,
        stringify({ ...postmarkWithoutSig, signature })!,
    );

    return {
        nonce,
        ciphertext,
        ephemPublicKey,
    };
}

function signPostmark(
    p: Omit<Postmark, 'signature'>,
    signingKey: string,
): Promise<string> {
    const postmarkHash = sha256(stringify(p));
    return sign(signingKey, postmarkHash);
}
