import { SignedUserProfile } from '@dm3-org/dm3-lib-profile';

//Struct that represents a Dm3 key store
export interface IDm3KeyStore {
    [signerAddress: string]: {
        signerPublicKey: string;
        encryptedProfileKeys?: string;
    };
}

export interface IKeyStoreService {
    /*
     * Method to publish the Dm3 user profile. Ideally this should be ENS or any other place that can be access using a resolver
     */
    writeDm3Profile(userProfile: SignedUserProfile): Promise<void>;
    /* Method to publish the Dm3 key store. Ideally this should be ENS or any other place that can be access using a resolver */

    writeDm3KeyStore(keyStore: IDm3KeyStore): Promise<void>;

    /* Convenience method to support batch calls */
    writeDm3KeyStoreAndUserProfile(
        keyStore: IDm3KeyStore,
        userProfile: SignedUserProfile,
    ): Promise<void>;

    readDm3Profile(): Promise<SignedUserProfile | undefined>;
    readDm3KeyStore(): Promise<IDm3KeyStore>;

    /* Returns the address of the Smart Account the KeyStore is associated with */
    getAccountAddress(): string;
}
