import axios from 'axios';
import { Account, SignedUserProfile } from '../account/Account';
import { Acknoledgment } from '../delivery';
import { getDeliveryServiceProfile } from '../delivery/Delivery';
import { EncryptionEnvelop, Envelop } from '../messaging/Messaging';
import { log } from '../shared/log';
import { UserDB } from '../storage';
import { Connection } from '../web3-provider/Web3Provider';
import { formatAddress } from './InjectedWeb3API';

const PROFILE_PATH = '/profile';
const DELIVERY_PATH = '/delivery';
const AUTH_SERVICE_PATH = '/auth';

function getAxiosConfig(token: string) {
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
}

function checkAccount(account: Account | undefined): Required<Account> {
    if (!account) {
        throw Error('No account');
    }
    if (!account.profile) {
        throw Error('Account has no profile.');
    }
    return account as Required<Account>;
}

export async function getChallenge(
    account: Account,
    connection: Connection,
): Promise<string> {
    const { profile, address } = checkAccount(account);
    const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
        profile,
        connection,
    );

    const url = `${deliveryServiceUrl}${AUTH_SERVICE_PATH}/${formatAddress(
        address,
    )}`;

    const { data } = await axios.get(url);

    return data.challenge;
}
export type GetChallenge = typeof getChallenge;

export async function getNewToken(
    account: Account,
    connection: Connection,
    signature: string,
): Promise<string> {
    const { profile, address } = checkAccount(account);
    const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
        profile,
        connection,
    );
    const url = `${deliveryServiceUrl}${AUTH_SERVICE_PATH}/${formatAddress(
        address,
    )}`;

    const { data } = await axios.post(url, {
        signature,
    });

    return data.token;
}
export type GetNewToken = typeof getNewToken;

export async function submitUserProfile(
    account: Account,
    connection: Connection,
    signedUserProfile: SignedUserProfile,
): Promise<string> {
    const { profile, address } = checkAccount(account);
    const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
        profile,
        connection,
    );

    const url = `${deliveryServiceUrl}${PROFILE_PATH}/${formatAddress(
        address,
    )}`;

    const { data } = await axios.post(url, signedUserProfile);

    return data;
}
export type SubmitUserProfile = typeof submitUserProfile;

export async function submitMessage(
    connection: Connection,
    userDb: UserDB,
    envelop: Envelop | EncryptionEnvelop,
    onSuccess: () => void,
    onError: () => void,
): Promise<void> {
    if (connection.socket) {
        connection.socket.emit(
            'submitMessage',
            {
                envelop,
                token: userDb.deliveryServiceToken,
            },
            (response: string) => {
                if (response === 'success') {
                    log(`- success`);
                    onSuccess();
                } else {
                    log(`- error`);
                    onError();
                }
            },
        );
    }
}
export type SubmitMessage = typeof submitMessage;

export async function syncAcknoledgment(
    connection: Connection,
    acknoledgments: Acknoledgment[],
    userDb: UserDB,
    lastMessagePull: number,
): Promise<void> {
    const { account } = connection;
    const { profile } = checkAccount(account);
    const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
        profile,
        connection,
    );
    const url = `${deliveryServiceUrl}${DELIVERY_PATH}/messages/${
        account!.address
    }/syncAcknoledgment/${lastMessagePull}`;
    return axios.post(
        url,
        { acknoledgments },
        getAxiosConfig(userDb.deliveryServiceToken),
    );
}
export type SyncAcknoledgment = typeof syncAcknoledgment;

export async function createPendingEntry(
    connection: Connection,
    userDb: UserDB,
    accountAddress: string,
    contactAddress: string,
): Promise<void> {
    if (connection.socket) {
        log(`Create pending entry`);
        connection.socket.emit('pendingMessage', {
            accountAddress,
            contactAddress,
            token: userDb.deliveryServiceToken,
        });
    }
}
export type CreatePendingEntry = typeof createPendingEntry;

export async function getNewMessages(
    connection: Connection,
    userDb: UserDB,
    contactAddress: string,
): Promise<EncryptionEnvelop[]> {
    const { account } = connection;
    const { profile } = checkAccount(account);

    const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
        profile,
        connection,
    );
    const url = `${deliveryServiceUrl}${DELIVERY_PATH}/messages/${
        account!.address
    }/contact/${contactAddress}`;

    const { data } = await axios.get(
        url,
        getAxiosConfig(userDb.deliveryServiceToken),
    );

    return data;
}
export type GetNewMessages = typeof getNewMessages;

export async function getPendingConversations(
    connection: Connection,
    userDb: UserDB,
): Promise<string[]> {
    const { account } = connection;
    const { profile } = checkAccount(account);
    const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
        profile,
        connection,
    );
    const url = `${deliveryServiceUrl}${DELIVERY_PATH}/messages/${
        account!.address
    }/pending/`;

    const { data } = await axios.post(
        url,
        {},
        getAxiosConfig(userDb.deliveryServiceToken),
    );

    return data;
}
export type GetPendingConversations = typeof getPendingConversations;

export async function getUserProfileOffChain(
    connection: Connection,
    account: Account | undefined,
    contact: string,
    url?: string,
): Promise<SignedUserProfile | undefined> {
    const getFallbackUrl = async () => {
        checkAccount(account);
        const { profile } = checkAccount(account);
        const { url: deliveryServiceUrl } = await getDeliveryServiceProfile(
            profile,
            connection,
        );
        return `${deliveryServiceUrl}${PROFILE_PATH}/${contact}`;
    };

    try {
        const { data } = await axios.get(url ? url : await getFallbackUrl());
        return data;
    } catch (e) {
        if ((e as Error).message.includes('404')) {
            return undefined;
        } else {
            throw Error('Unknown API error');
        }
    }
}
export type GetUserProfileOffChain = typeof getUserProfileOffChain;
