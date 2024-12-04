import { EventEmitter } from 'events';
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
// import { Dm3 } from './Dm3';
import { ITLDResolver } from './tld/nameService/ITLDResolver';

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
    storageApi?: StorageAPI;
    nonce: string;
    defaultDeliveryService: string;
    addressEnsSubdomain: string;
    userEnsSubdomain: string;
    resolverBackendUrl: string;
    backendUrl: string;
    _tld?: ITLDResolver;
}

export class Dm3Sdk extends EventEmitter {
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
    public storageApi?: StorageAPI;

    /**
     * DM3 CONVERSATIONS
     */
    public conversations: Conversations;

    private _selectedConversationId: string;

    getConversations() {
        return this.conversations;
    }

    getMessagesByConversation(ensName?: string) {
        if (ensName) {
            this._selectedConversationId = ensName;
        }
        
        if (!this._selectedConversationId) {
            throw new Error('No conversation selected');
        }

        // TODO: ens name might not be the best option to identify the conversation, we should introduce some id
        const selectedConversation = this.conversations.list.find(c => c.contact.account.ensName === this._selectedConversationId);
        
        if (!selectedConversation) {
            throw new Error('Selected conversation not found');
        }

        return selectedConversation.messages;
    }

    /**
     * DM3 TLD
     */
    private _tld?: ITLDResolver;

    constructor(config: Dm3SdkConfig) {
        super();
        //TODO keep ethers v5 for know but extract into common interface later
        this.mainnetProvider = config.mainnetProvider;
        this.nonce = config.nonce;
        //TODO make the name more concise and make it a array -> defaultDeliveryServiceEnsNames
        this.defaultDeliveryService = config.defaultDeliveryService;
        this.addressEnsSubdomain = config.addressEnsSubdomain;
        this.userEnsSubdomain = config.userEnsSubdomain;
        this.resolverBackendUrl = config.resolverBackendUrl;
        this.backendUrl = config.backendUrl;
        this._tld = config._tld;
        this.storageApi = config.storageApi;
    }
    /**
     * login can be used to login with a profile regardles the connector. Its also great for testing
     */
    public async login({
        profileKeys,
        profile,
        accountAddress,
    }: {
        profileKeys: ProfileKeys;
        profile: SignedUserProfile;
        accountAddress: string;
    }) {
        console.log('hello sdk');

        const tld =
            this._tld ??
            new Tld(
                this.mainnetProvider,
                this.addressEnsSubdomain,
                this.userEnsSubdomain,
                this.resolverBackendUrl,
            );

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
        const encCS = new EncryptedCloudStorage(
            beConnector,
            account,
            this.profileKeys,
        );
        console.log('encCS', encCS.account);
        this.storageApi = encCS.getCloudStorage();

        console.log('this.storageApi', this.storageApi);
        console.log(
            'SAPI account',
            (this.storageApi as unknown as EncryptedCloudStorage).account,
        );

        const conversations = new Conversations(
            this.storageApi,
            tld,
            this.mainnetProvider,
            account,
            profileKeys,
            this.addressEnsSubdomain,
            (event: string, eventData: any) => {
                this.emit('dm3_event', { event, eventData });
            },
        );
        await conversations._init();

        this.conversations = conversations;

        return this;
    }

    /**
     * Convenience method to login with a cached provider. 
     * DO NOT USE IN PRODUCTION since it stores the keys in the local storage!
     * @param lukso 
     * @returns 
     */
    public async universalProfileLoginWithCache(requestProvider: () => Promise<ethers.providers.ExternalProvider>) {
        const cachedCredentials = localStorage.getItem('credentials');
        
        if (cachedCredentials) {
            const credentials = JSON.parse(cachedCredentials);
            return this.login(credentials);
        }

        const lukso = await requestProvider();
        if (!lukso) {
            throw new Error('Lukso provider not found');
        }
        const lc = await LuksoConnector._instance(
            lukso,
            this.nonce,
            this.defaultDeliveryService,
        );
        
        const loginResult = await lc.login();
        localStorage.setItem('credentials', JSON.stringify(loginResult));
        return this.login(loginResult as Success);
    }

    public async universalProfileLogin(lukso: ethers.providers.ExternalProvider) {
        if (!lukso) {
            throw new Error('Lukso provider not found');
        }
        const lc = await LuksoConnector._instance(
            lukso,
            this.nonce,
            this.defaultDeliveryService,
        );

        console.log('lcgoo', lc, typeof lc.login);
        const loginResult = await lc.login();

        console.log('loginResult', loginResult);

        const { profileKeys, profile, accountAddress } = loginResult as Success;
        return await this.login({ profileKeys, profile, accountAddress });
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
