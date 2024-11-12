import {
    normalizeEnsName,
    ProfileKeys,
    SignedUserProfile,
} from '@dm3-org/dm3-lib-profile';
import { LuksoConnector } from './connectors/LuksoConnector';
import { Success } from './connectors/SmartAccountConnector';
import { Conversations } from './conversation/Conversations';
import { EncryptedCloudStorage } from './storage/EncryptedCloudStorage';
import { Account } from '@dm3-org/dm3-lib-profile';
import { BackendConnector } from './api/BackendConnector';
import { StorageAPI } from '@dm3-org/dm3-lib-storage';
import { ethers } from 'ethers';
import { Tld } from './tld/Tld';
import { Dm3 } from './Dm3';

/**
 * DM3SDK
 * -contacts
 * -message
 * -profile
 */

const DEFAULT_CONVERSATION_PAGE_SIZE = 10;

export function getIdForAddress(address: string, addrEnsSubdomain: string) {
    return address + addrEnsSubdomain;
}

export interface Dm3SdkConfig {
    mainnetProvider: ethers.providers.JsonRpcProvider;
    nonce: string;
    defaultDeliveryService: string;
    addressEnsSubdomain: string;
    userEnsSubdomain: string;
    resolverBackendUrl: string;
    backendUrl: string;
    lukso?: ethers.providers.ExternalProvider;
}

export class Dm3Sdk {
    private readonly mainnetProvider: ethers.providers.JsonRpcProvider;
    private readonly lukso?: ethers.providers.ExternalProvider;

    /**
     * DM3 ENVIRONMENT
     */
    private readonly nonce: string;
    private readonly defaultDeliveryService: string;
    private readonly addressEnsSubdomain: string;
    private readonly userEnsSubdomain: string;
    private readonly backendUrl: string;
    private readonly resolverBackendUrl: string;
    /**
     * DM3 PROFILE OF THE USER
     */
    private profileKeys: ProfileKeys;
    private profile: SignedUserProfile;
    private accountAddress: string;

    /**
     * DM3 STORAGE
     */
    private storageApi: StorageAPI;

    /**
     * DM3 CONVERSATIONS
     */
    public conversations: Conversations;

    constructor(config: Dm3SdkConfig) {
        //TODO keep ethers v5 for know but extract into common interface later
        this.mainnetProvider = config.mainnetProvider;
        this.nonce = config.nonce;
        //TODO make the name more concise and make it a array -> defaultDeliveryServiceEnsNames
        this.defaultDeliveryService = config.defaultDeliveryService;
        this.addressEnsSubdomain = config.addressEnsSubdomain;
        this.userEnsSubdomain = config.userEnsSubdomain;
        this.resolverBackendUrl = config.resolverBackendUrl;
        //this.backendUrl = config.backendUrl;
        this.lukso = config.lukso;
        this.storageApi = config.storageApi;
    }

    public async universalProfileLogin() {
        if (!this.lukso) {
            throw new Error('Lukso provider not found');
        }
        const tld = new Tld(
            this.mainnetProvider,
            this.addressEnsSubdomain,
            this.userEnsSubdomain,
            this.resolverBackendUrl,
        );
        const lc = await LuksoConnector._instance(
            this.lukso,
            this.nonce,
            this.defaultDeliveryService,
        );
        const loginResult = await lc.login();

        const { profileKeys, profile, accountAddress } = loginResult as Success;

        this.profileKeys = profileKeys;
        this.profile = profile;
        this.accountAddress = accountAddress;

        const ensName = getIdForAddress(
            accountAddress,
            this.addressEnsSubdomain,
        );

        const account: Account = {
            ensName: normalizeEnsName(ensName),
            profile: profile.profile,
            profileSignature: profile.signature,
        };

        const beConnector = await this.initializeBackendConnector(
            accountAddress,
            profileKeys,
            profile,
        );

        await beConnector.login(profile);

        const conversations = new Conversations(
            this.storageApi,
            tld,
            this.mainnetProvider,
            account,
            this.addressEnsSubdomain,
        );

        this.storageApi = new EncryptedCloudStorage(
            beConnector,
            account,
            this.profileKeys,
        ).getCloudStorage();

        return new Dm3(conversations, tld);
    }

    private async initializeBackendConnector(
        accountAddress: string,
        profileKeys: ProfileKeys,
        profile: SignedUserProfile,
    ) {
        const beConnector = new BackendConnector(
            this.backendUrl,
            this.resolverBackendUrl,
            this.addressEnsSubdomain,
            accountAddress!,
            profileKeys!,
            profile,
        );
        return beConnector;
    }
}
