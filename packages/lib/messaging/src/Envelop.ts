import {
    EncryptAsymmetric,
    encryptAsymmetric,
    sign,
} from '@dm3-org/dm3-lib-crypto';
import { getSize, sha256, stringify } from '@dm3-org/dm3-lib-shared';
import { Message, Postmark, SendDependencies } from './Message';
import { ethers } from 'ethers';
import {
    Account,
    DeliveryServiceProfile,
    GetResource,
    ProfileExtension,
    ProfileKeys,
    getDeliveryServiceProfile,
    getUserProfile,
} from '@dm3-org/dm3-lib-profile';

export interface EnvelopeMetadata {
    version: string;
    encryptionScheme?: string;
    deliveryInformation: string | DeliveryInformation;
    messageHash: string;
    signature: string;
}

export interface EncryptionEnvelop {
    message: string;
    metadata: EnvelopeMetadata;
    postmark?: string;
}

export interface Envelop {
    message: Message;
    metadata?: EnvelopeMetadata;
    postmark?: Postmark;
    id?: string;
}

// And envelop that has been encrypted and is ready to be sent
export type DispatchableEnvelop = {
    encryptedEnvelop: EncryptionEnvelop;
    envelop: Envelop;
    deliveryServiceUrl: string;
};

export interface DeliveryInformation {
    to: string;
    from: string;
    deliveryInstruction?: string;
}

export async function createSendDependencies(
    toEnsName: string,
    fromEnsName: string,
    provider: ethers.providers.JsonRpcProvider,
    keys: ProfileKeys,
    getRessource: GetResource<DeliveryServiceProfile>,
    sendDependenciesCache?: Partial<SendDependencies>,
): Promise<SendDependencies> {
    const to = sendDependenciesCache?.to ?? {
        ensName: toEnsName,
        profile: (await getUserProfile(provider, toEnsName))?.profile,
    };
    if (!to.profile) {
        throw Error(`No profile for ${to.ensName}`);
    }
    const deliverServiceProfile =
        sendDependenciesCache?.deliverServiceProfile ??
        (await getDeliveryServiceProfile(
            to.profile.deliveryServices[0],
            provider,
            getRessource,
        ));
    if (!deliverServiceProfile) {
        throw Error(`No profile for ${to.profile.deliveryServices[0]}`);
    }

    return {
        to,
        from: sendDependenciesCache?.from ?? {
            ensName: fromEnsName,
            profile: (await getUserProfile(provider, fromEnsName))?.profile,
        },
        deliverServiceProfile,
        keys,
    };
}

export async function createEnvelop(
    message: Message,
    provider: ethers.providers.JsonRpcProvider,
    keys: ProfileKeys,
    getRessource: GetResource<DeliveryServiceProfile>,
    sendDependenciesCache?: Partial<SendDependencies>,
): Promise<{
    encryptedEnvelop: EncryptionEnvelop;
    envelop: Envelop;
    sendDependencies: SendDependencies;
}> {
    const sendDependencies = await createSendDependencies(
        message.metadata.to,
        message.metadata.from,
        provider,
        keys,
        getRessource,
        sendDependenciesCache,
    );

    return {
        ...(await buildEnvelop(message, encryptAsymmetric, sendDependencies)),
        sendDependencies,
    };
}

export async function buildEnvelop(
    message: Message,
    encryptAsymmetric: EncryptAsymmetric,
    { to, from, deliverServiceProfile, keys }: SendDependencies,
    preEncryptedMessage?: string,
): Promise<DispatchableEnvelop> {
    if (!to.profile) {
        throw Error('Contact has no profile');
    }
    /**
     * Encrypts a message using the receivers public encryptionKey
     */
    const encryptedMessage =
        preEncryptedMessage ??
        stringify(
            await encryptAsymmetric(
                to.profile.publicEncryptionKey,
                stringify(message),
            ),
        );

    const deliveryInformation: DeliveryInformation = {
        to: to.ensName,
        from: from.ensName,
    };
    /**
     * Builds the {@see EnvelopMetadata} for the message
     * and encrypts the {@see DeliveryInformation} using the deliveryServiceEncryptionPubKey
     * the messageHash field is mendatory to establish a link between the message and metadata
     */
    const envelopeMetadata: Omit<EnvelopeMetadata, 'signature'> = {
        encryptionScheme: 'x25519-chacha20-poly1305',
        deliveryInformation: stringify(
            await encryptAsymmetric(
                deliverServiceProfile.publicEncryptionKey,
                stringify(deliveryInformation),
            ),
        ),
        //Even though the fields name is messageHash we hash the message to be able to find message duplicates
        //For examples messages comming from the same DS
        messageHash: sha256(stringify(message)),
        version: 'v1',
    };

    /**
     * Signes the Metadata of the envelop using the senders privateKey
     */
    const metadata = {
        ...envelopeMetadata,
        signature: await sign(
            keys.signingKeyPair.privateKey,
            stringify(envelopeMetadata),
        ),
    };

    return {
        encryptedEnvelop: {
            message: encryptedMessage,
            metadata,
        },
        envelop: {
            message,
            metadata: { ...metadata, deliveryInformation },
        },
        //Add the deliveryServiceUrl to the envelop, so it becomes clear where the encrypted message should be sent.
        //Important when having different deliveryServices because and enevlop sent to the wrong url will be rejected
        deliveryServiceUrl: deliverServiceProfile.url,
    };
}

/**
 * This function calculates the size in bytes of the input envelop object.
 * It uses the getSize function to calculate the size.
 * It unifies the calculation of the size of the message and the metadata.
 *
 * @param {EncryptionEnvelop} envelop - The envelop object whose size is to be calculated.
 * @returns {number} The size of the input envelop object in bytes.
 */
export function getEnvelopSize(envelop: EncryptionEnvelop): number {
    return getSize(envelop);
}
