import { EncryptAsymmetric, encryptAsymmetric, sign } from 'dm3-lib-crypto';
import { sha256, stringify } from 'dm3-lib-shared';
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
} from 'dm3-lib-profile';

export interface EnvelopeMetadata {
    version: string;
    encryptionScheme?: string;
    deliveryInformation: string | DeliveryInformation;
    encryptedMessageHash: string;
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
): Promise<{ encryptedEnvelop: EncryptionEnvelop; envelop: Envelop }> {
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
     * the encryptedMessageHash field is mendatory to establish a link between the message and metadata
     */
    const envelopeMetadata: Omit<EnvelopeMetadata, 'signature'> = {
        encryptionScheme: 'x25519-chacha20-poly1305',
        deliveryInformation: stringify(
            await encryptAsymmetric(
                deliverServiceProfile.publicEncryptionKey,
                stringify(deliveryInformation),
            ),
        ),
        encryptedMessageHash: sha256(stringify(encryptedMessage)),
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
    };
}
