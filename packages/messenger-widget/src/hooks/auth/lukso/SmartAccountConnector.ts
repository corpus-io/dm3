import {
    createStorageKey,
    decryptAsymmetric,
    encryptAsymmetric,
    EncryptedPayload,
    getStorageKeyCreationMessage,
    KeyPair,
} from '@dm3-org/dm3-lib-crypto';
import {
    createProfileKeys as _createProfileKeys,
    getProfileCreationMessage,
    ProfileKeys,
    SignedUserProfile,
    UserProfile,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { KeyStore } from '@dm3-org/dm3-lib-smart-account';
import { SiweMessage } from 'siwe';

export type LoginResult = Success | NewDevice;

export type Success = {
    type: 'SUCCESS';
    profileKeys: ProfileKeys;
    profile: SignedUserProfile;
    controllerAddress: string;
    accountAddress: string;
};
export type NewDevice = {
    type: 'NEW_DEVICE';
    controllers: string[];
};

export enum LoginStages {
    //The account has never used dm3 before. The KeyStore has to be created yet
    'NEW',
    //The keyStore already contains encrypted profileKeys for the controller
    'CONTROLLER_KNOWN',
    //The keyStore already contains encrypted profileKeys but not for the controller. The controller has to publish its publicKey
    'CONTROLLER_UNKNOWN',
    //The keyStore already contains encrypted profileKeys for the controller. But another controller has requested the profileKeys.
    'OPEN_KEY_EXCHANGE_REQUEST',
    //The controller has requested the profileKeys of another controller but the request has not been accepted yet
    'KEY_EXCHANGE_PENDING',
    //Something went wrong. Should not happen if the KeyExchange has been done correctly.
    //However there might be edge cases (someone publishing an invalid keyStore on their own) that could lead to this state
    'ERROR',
}

export class SmartAccountConnector {
    //The controller is a EOA that can sign on behalf of the Smart Account
    private readonly controller: ethers.Signer;
    //An instnace of the keyStoreService that is used to read and write the keyStore
    private readonly keyStoreService: KeyStore.IKeyStoreService;
    //The nonce is used to create the profileKeys
    private readonly nonce;

    private readonly defaultDeliveryService;

    //After the user created the encryptionKeyPair once, it can be reused to decrypt the profileKeys of other controllers
    private cachedEncryptionKeys: {
        encryptionKeyPair: KeyPair;
        signature: string;
    };

    constructor(
        keyStoreService: KeyStore.IKeyStoreService,
        upController: ethers.Signer,
        nonce: string,
        defaultDeliveryService: string,
    ) {
        this.keyStoreService = keyStoreService;
        this.controller = upController;
        this.nonce = nonce;
        this.defaultDeliveryService = defaultDeliveryService;
    }
    public async test() {}
    //KeySync can be triggered by controller that has used dm3 before.
    //This function will normally be called after login on behalf of the user
    public async syncKeys() {
        //1. Get the current keyStore
        const { encryptionKeyPair, signature } =
            await this.createEncryptionKeys();

        const upControllerAddress =
            await this.recoverAddressFromEncryptionKeySignature(signature);

        const keyStore = await this.keyStoreService.readDm3KeyStore();

        const encryptedControllerKeyStore = keyStore[upControllerAddress];

        //Should not happen because this function should only be called after login
        if (
            !encryptedControllerKeyStore ||
            !encryptedControllerKeyStore.encryptedProfileKeys
        ) {
            throw 'Controller has not used dm3 before';
        }

        //2. Decrypt the profileKeys of the controller
        const payload: EncryptedPayload = JSON.parse(
            atob(encryptedControllerKeyStore.encryptedProfileKeys),
        ) as EncryptedPayload;

        //Decrpyt the profileKeys of the controller
        const profileKeys = await decryptAsymmetric(
            encryptionKeyPair,
            payload,
            1,
        );
        //For each device in the keyStore, encrypt the profileKeys of the controller
        //That only applies for controllers that have a publicKey but not encryptedProfileKeys yet
        const newKeyStore: KeyStore.IDm3KeyStore = {};

        for (const key of Object.keys(keyStore)) {
            const controller = keyStore[key];

            // If the controller already has a profile we don't have to encrypt the profileKeys
            if (controller.encryptedProfileKeys) {
                newKeyStore[key] = controller;
                continue;
            }

            const encryptedProfileKeys = await encryptAsymmetric(
                controller.signerPublicKey,
                profileKeys,
                1,
            );

            newKeyStore[key] = {
                ...controller,
                encryptedProfileKeys: btoa(stringify(encryptedProfileKeys)),
            };
        }

        //3. Write the new keyStore
        await this.keyStoreService.writeDm3KeyStore(newKeyStore);
    }

    //Login is called by the client to start the login process without knowing the state of the keyStore.

    public async login(): Promise<LoginResult> {
        const keyStore = await this.keyStoreService.readDm3KeyStore();
        //Smart account has never used dm3 before
        if (Object.keys(keyStore).length === 0) {
            return await this.signUp();
        }
        //Smart account has used Dm before. We have to check if the controller has published its public key yet
        const { encryptionKeyPair, signature } =
            await this.createEncryptionKeys();

        //Recover the address of the controller from the signature
        const upControllerAddress =
            await this.recoverAddressFromEncryptionKeySignature(signature);

        //Check if the controller has already a ketStore entry
        const encryptedControllerKeyStore = keyStore[upControllerAddress];

        //If the controller already has a keyStore, we can decrypt the profileKeys using its encryptionKeys
        //If not we've to start the keyExchange process
        if (
            !encryptedControllerKeyStore ||
            !encryptedControllerKeyStore.encryptedProfileKeys
        ) {
            //The signer connected to the UP has not  used dm3 before, it has to publish its public key so another device can share the profile keys
            return await this.addNewSigner(keyStore);
        }
        //The signer connected to the UP has already used dm3 before, hence it knows the profile
        return await this.signInExistingSigner(
            encryptionKeyPair,
            signature,
            encryptedControllerKeyStore.encryptedProfileKeys,
        );
    }
    public async getLoginStages(): Promise<LoginStages> {
        const keyStore = await this.keyStoreService.readDm3KeyStore();
        if (Object.keys(keyStore).length === 0) {
            return LoginStages.NEW;
        }
        // const encryptedControllerKeyStore =
        //     keyStore[await this.controller.getAddress()];

        // if (!encryptedControllerKeyStore) {
        //     return LoginStages.CONTROLLER_UNKNOWN;
        // }
        // const { encryptedProfileKeys } = encryptedControllerKeyStore;

        // if (!encryptedProfileKeys) {
        //     return LoginStages.KEY_EXCHANGE_PENDING;
        // }

        //Find out if there are other controllers that have requested the profileKeys

        //        const _controllerAddress = await this.controller.getAddress();
        // const openKeyExchangeRequest = Object.keys(keyStore).some(
        //     (key) =>
        //         key !== _controllerAddress &&
        //         !keyStore[key].encryptedProfileKeys,
        // );

        // if (openKeyExchangeRequest) {
        //     return LoginStages.OPEN_KEY_EXCHANGE_REQUEST;
        // }

        // if (encryptedProfileKeys) {
        //     return LoginStages.CONTROLLER_KNOWN;
        // }
        return LoginStages.ERROR;
    }
    private async createProfileKeys() {
        //TODO replace with crytpo graphically secure random bytes
        const seed = ethers.utils.randomBytes(32).toString();
        const message =
            'The following message creates the DM3 Keystore that can be used to share messages between different devices \n' +
            seed;

        const signature = await this.controller.signMessage(message);
        const storageKey = await createStorageKey(signature);
        return await _createProfileKeys(storageKey, this.nonce);
    }

    //Returns Keys to encrypt the actual profile at UP
    private async createEncryptionKeys() {
        //If the user has created its encryption keys before, we can reuse them. That way we don't have to ask the user to sign again
        if (this.cachedEncryptionKeys) {
            return this.cachedEncryptionKeys;
        }
        const upAddress = await this.keyStoreService.getAccountAddress();
        const statement =
            `Connect the DM3 MESSENGER with your wallet. ` +
            `Keys for secure communication are derived from this signature.` +
            `(There is no paid transaction initiated. The signature is used off-chain only.)`;

        const message = new SiweMessage({
            domain: 'dm3.chat',
            address: upAddress,
            statement,
            uri: 'https://dm3.chat',
            version: '1',
            chainId: 42,
            nonce: this.nonce,
            //Date is a mandatory property otherwise it'll be DAte.now(). We need it to be constant to create teh encryption keys deterministically
            issuedAt: new Date(978307200000).toISOString(),
            resources: ['https://dm3.network'],
        });

        const signature = await this.controller.signMessage(
            message.prepareMessage(),
        );
        const storageKey = await createStorageKey(signature);

        const keys = await _createProfileKeys(storageKey, this.nonce);

        //Keep the encryptionKeyPair for later use
        this.cachedEncryptionKeys = {
            encryptionKeyPair: keys.encryptionKeyPair,
            signature: signature,
        };

        return {
            encryptionKeyPair: keys.encryptionKeyPair,
            signature: signature,
        };
    }
    private async recoverAddressFromEncryptionKeySignature(signature: string) {
        const upAddress = await this.keyStoreService.getAccountAddress();
        const statement =
            `Connect the DM3 MESSENGER with your wallet. ` +
            `Keys for secure communication are derived from this signature.` +
            `(There is no paid transaction initiated. The signature is used off-chain only.)`;

        const message = new SiweMessage({
            domain: 'dm3.chat',
            address: upAddress,
            statement,
            uri: 'https://dm3.chat',
            version: '1',
            chainId: 42,
            nonce: this.nonce,
            //Date is a mandatory property otherwise it'll be DAte.now(). We need it to be constant to create teh encryption keys deterministically
            issuedAt: new Date(978307200000).toISOString(),
            resources: ['https://dm3.network'],
        });

        return ethers.utils.recoverAddress(
            ethers.utils.hashMessage(message.prepareMessage()),
            signature,
        );
    }

    private async createNewSignedUserProfile(
        { signingKeyPair, encryptionKeyPair }: ProfileKeys,
        defaultDeliveryService: string,
        upAddress: string,
    ) {
        const profile: UserProfile = {
            publicSigningKey: signingKeyPair.publicKey,
            publicEncryptionKey: encryptionKeyPair.publicKey,
            deliveryServices: [defaultDeliveryService],
        };

        const profileCreationMessage = getProfileCreationMessage(
            stringify(profile),
            upAddress,
        );
        const signature = await this.controller.signMessage(
            profileCreationMessage,
        );

        return {
            profile,
            signature,
        } as SignedUserProfile;
    }

    private async signInExistingSigner(
        encryptionKeyPair: KeyPair,
        encryptionKeyPairSignature: string,
        encryptedProfileKeys: string,
    ): Promise<Success> {
        const payload: EncryptedPayload = JSON.parse(
            atob(encryptedProfileKeys),
        ) as EncryptedPayload;

        const profileKeys = await decryptAsymmetric(
            encryptionKeyPair,
            payload,
            1,
        );

        const upControllerAddress =
            await this.recoverAddressFromEncryptionKeySignature(
                encryptionKeyPairSignature,
            );

        const userProfile = await this.keyStoreService.readDm3Profile();

        return {
            type: 'SUCCESS',
            profileKeys: JSON.parse(profileKeys) as ProfileKeys,
            profile: userProfile!,
            controllerAddress: upControllerAddress,
            accountAddress: await this.keyStoreService.getAccountAddress(),
        };
    }

    // Device2 checks if a UserProfile has been published for this UP. It has.
    // Device2 checks if encrypted profileKeys for its deviceKeys are available locally or on an appropriate service.
    // They are not.
    // Device2 starts the key transfer process, by:
    // Storing Device2 public key on an appropriate service
    private async addNewSigner(keyStore: KeyStore.IDm3KeyStore) {
        const { encryptionKeyPair, signature } =
            await this.createEncryptionKeys();

        const upControllerAddress =
            await this.recoverAddressFromEncryptionKeySignature(signature);

        //The controller has to publish its publicKey to the UP so any other device can share the profile keys with it
        const newKeyStore = {
            ...keyStore,
            [upControllerAddress]: {
                signerPublicKey: encryptionKeyPair.publicKey,
            },
        };

        await this.keyStoreService.writeDm3KeyStore(newKeyStore);
        //Indicate that a new device has been added. The user has to go back to device 1 to share the profile keys
        return {
            type: 'NEW_DEVICE',
            //Eventually the client would tell the user the addresses of the other devices.
            controllers: Object.keys(keyStore ?? {}),
        } as LoginResult;
    }

    //Creates a session for a smart account that has never used dm3 before
    // 1. Device1 creates profileKeys from random seed
    // 2. UP publishes Dm3-UserProfile based on profileKeys created in #1 to UP KV (key value) store
    // 3. Device uploads encrypted profileKeys to KV store
    private async signUp(): Promise<Success> {
        const { encryptionKeyPair, signature } =
            await this.createEncryptionKeys();

        //the controller connected to the smart account
        const upContollerAddress =
            await this.recoverAddressFromEncryptionKeySignature(signature);

        const smartAccountAddress =
            await this.keyStoreService.getAccountAddress();

        const profileKeys = await this.createProfileKeys();

        const encryptedPayload: EncryptedPayload = await encryptAsymmetric(
            encryptionKeyPair.publicKey,
            stringify(profileKeys),
            1,
        );
        const encryptedProfileKeys = btoa(stringify(encryptedPayload));

        const dm3KeyStore: KeyStore.IDm3KeyStore = {
            [upContollerAddress]: {
                encryptedProfileKeys,
                signerPublicKey: profileKeys.encryptionKeyPair.publicKey,
            },
        };

        const userProfile = await this.createNewSignedUserProfile(
            profileKeys,
            this.defaultDeliveryService,
            smartAccountAddress,
        );
        await this.keyStoreService.writeDm3KeyStoreAndUserProfile(
            dm3KeyStore,
            userProfile,
        );

        return {
            type: 'SUCCESS',
            profileKeys,
            profile: userProfile!,
            controllerAddress: upContollerAddress,
            accountAddress: smartAccountAddress,
        };
    }
}
