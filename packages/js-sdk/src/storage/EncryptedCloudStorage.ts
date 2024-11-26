import { Account, ProfileKeys } from '@dm3-org/dm3-lib-profile';
import { IBackendConnector, sha256, stringify } from '@dm3-org/dm3-lib-shared';
import { getCloudStorage } from '@dm3-org/dm3-lib-storage';
import {
    EncryptedPayload,
    decrypt as _decrypt,
    encrypt as _encrypt,
    decryptAsymmetric,
    encryptAsymmetric,
} from '@dm3-org/dm3-lib-crypto';
export class EncryptedCloudStorage {
    private readonly backendConnector: IBackendConnector;
    public readonly account: Account;
    private readonly profileKeys: ProfileKeys;

    constructor(
        backendConnector: IBackendConnector,
        account: Account,
        profileKeys: ProfileKeys,
    ) {
        if (!account.ensName) {
            throw new Error('Account must have an ENS name');
        }

        this.backendConnector = backendConnector;
        this.account = account;
        this.profileKeys = profileKeys;
    }

    private async encryptSync(data: string) {
        console.log('this.account', this.account);
        console.log('this.account.ensName', this.account.ensName);

        const accountNonce = sha256(this.account.ensName).slice(0, 26);
        const encryptedPayload: EncryptedPayload = await _encrypt(
            this.profileKeys?.encryptionKeyPair?.privateKey!,
            data,
            accountNonce,
            1,
        );
        return btoa(stringify(encryptedPayload));
    }
    private async decryptSync(data: string) {
        const payload: EncryptedPayload = JSON.parse(
            atob(data),
        ) as EncryptedPayload;

        return await _decrypt(
            this.profileKeys?.encryptionKeyPair!.privateKey!,
            payload,
            1,
        );
    }
    private async encryptAsync(data: string) {
        const encryptedPayload: EncryptedPayload = await encryptAsymmetric(
            this.profileKeys?.encryptionKeyPair?.publicKey!,
            data,
        );
        return btoa(stringify(encryptedPayload));
    }
    private async decryptAsync(data: string) {
        const payload: EncryptedPayload = JSON.parse(
            atob(data),
        ) as EncryptedPayload;

        return await decryptAsymmetric(
            this.profileKeys?.encryptionKeyPair!,
            payload,
        );
    }

    public getCloudStorage() {
        return getCloudStorage(this.backendConnector, this.account.ensName, {
            encryptAsync: this.encryptAsync,
            decryptAsync: this.decryptAsync,
            encryptSync: this.encryptSync,
            decryptSync: this.decryptSync,
        });
    }
}
