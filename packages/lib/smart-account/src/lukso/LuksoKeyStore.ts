import { SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import {
    IDm3KeyStore,
    IKeyStoreService as IKeyStore,
} from '../KeyStore/IKeyStore';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { ERC725JsonCoder } from './ERC725JsonCoder';

const { toUtf8Bytes } = ethers.utils;

declare global {
    interface Window {
        lukso?: any;
    }
}

export class LuksoKeyStore implements IKeyStore {
    //A wrapper around the UP contract
    private readonly upContract: ethers.Contract;
    private readonly erc725JsonCoder: ERC725JsonCoder;

    constructor(upContract: ethers.Contract) {
        this.upContract = upContract;

        const erc725 = new ERC725(
            ERC725JsonCoder.schemas,
            this.upContract.address,
            window.lukso!,
        );
        this.erc725JsonCoder = new ERC725JsonCoder(erc725);
    }
    getAccountAddress(): string {
        return this.upContract.address;
    }

    async writeDm3Profile(userProfile: SignedUserProfile): Promise<void> {
        const encoded = this.erc725JsonCoder.encodeDm3Profile(
            this.upContract.address,
            userProfile,
        );

        const { keys, values } = encoded;
        await this.upContract.setDataBatch([...keys], [...values]);
    }
    async writeDm3KeyStore(keyStore: IDm3KeyStore): Promise<void> {
        //Create a key for each address in the keyStore
        const encodeDataReturn = Object.keys(keyStore).map((a) => {
            return this.erc725JsonCoder.encodeDm3KeyStoreEntry(
                a,
                keyStore[a].signerPublicKey,
                keyStore[a].encryptedProfileKeys,
            );
        });
        //TODO find diff and post only modified keys
        const keys = encodeDataReturn.map((a) => a.keys[0]);
        const values = encodeDataReturn.map((a) => a.values[0]);

        await this.upContract.setDataBatch(keys, values);
    }
    async writeDm3KeyStoreAndUserProfile(
        keyStore: IDm3KeyStore,
        userProfile: SignedUserProfile,
    ): Promise<void> {
        //encode keyStore
        const encodedKeyStoreResult = Object.keys(keyStore).map((a) => {
            return this.erc725JsonCoder.encodeDm3KeyStoreEntry(
                a,
                keyStore[a].signerPublicKey,
                keyStore[a].encryptedProfileKeys,
            );
        });

        const encodedUserProfile = this.erc725JsonCoder.encodeDm3Profile(
            this.upContract.address,
            userProfile,
        );

        //TODO find diff and post only modified keys
        const keyStorekeys = encodedKeyStoreResult.map((a) => a.keys[0]);
        const keyStoreValues = encodedKeyStoreResult.map((a) => a.values[0]);

        const keys = [...keyStorekeys, ...encodedUserProfile.keys];
        const values = [...keyStoreValues, ...encodedUserProfile.values];

        await this.upContract.setDataBatch(keys, values);
    }
    async readDm3Profile(): Promise<SignedUserProfile | undefined> {
        return await this.erc725JsonCoder.decodeDm3Profile(
            this.upContract.address,
        );
    }
    async readDm3KeyStore(): Promise<IDm3KeyStore> {
        return await this.erc725JsonCoder.decodeDm3KeyStore();
    }
}
