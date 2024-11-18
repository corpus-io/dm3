import { Account } from '@dm3-org/dm3-lib-delivery';
import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import {
    UserProfile,
    getProfileCreationMessage,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import express from 'express';
import request from 'supertest';
import { Profile as profile } from './profile';
import { IDatabase } from '../persistence/getDatabase';

const serverSecret = 'veryImportantSecretToGenerateAndValidateJSONWebTokens';

const token = generateAuthJWT('alice.eth', serverSecret);

const setUpApp = async (
    app: express.Express,
    db: IDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    serverSecret: string = 'my-secret',
    luksoProvider: ethers.providers.JsonRpcProvider = {} as ethers.providers.JsonRpcProvider,
) => {
    app.use(bodyParser.json());
    app.use(profile(db, web3Provider, luksoProvider, serverSecret));
};

const createDbMock = async () => {
    const accountMocked = {
        challenge: '123',
        token: 'deprecated token that is not used anymore',
        signedUserProfile: {},
    } as Account;

    const dbMock = {
        getAccount: async (ensName: string) =>
            Promise.resolve<Account>(accountMocked), // returns some valid account
        setAccount: async (_: string, __: Account) => {},
        getIdEnsName: async (ensName: string) => ensName,
    };

    return dbMock as any;
};

describe('Profile', () => {
    describe('getProfile', () => {
        it('Returns 200 if user profile exists', async () => {
            const app = express();

            const db = await createDbMock();

            const _web3Provider = {
                resolveName: async () =>
                    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
            } as unknown as ethers.providers.JsonRpcProvider;
            // I don't know why this function is needed in this test.
            // Remove it after storage migration.
            db.getUserStorage = () => {};
            setUpApp(app, db, _web3Provider);

            const response = await request(app)
                .get('/alice.eth')
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            const status = response.status;

            expect(status).toBe(200);
        });
        it('Returns 404 if user profile not exists', async () => {
            const app = express();

            const db = {
                ...(await createDbMock()),
                getAccount: async (ensName: string) => Promise.resolve(null),
            };

            const _web3Provider = {
                resolveName: async () =>
                    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
            } as unknown as ethers.providers.JsonRpcProvider;
            // I don't know why this function is needed in this test.
            // Remove it after storage migration.
            setUpApp(app, db, _web3Provider);

            const response = await request(app)
                .get('/rando.eth')
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            const status = response.status;

            expect(status).toBe(404);
        });
        it('Returns 400 if the name could not be resolved', async () => {
            const app = express();

            const db = await createDbMock();

            const _web3Provider = {
                resolveName: async () => null,
            } as unknown as ethers.providers.JsonRpcProvider;
            // I don't know why this function is needed in this test.
            // Remove it after storage migration.
            db.getUserStorage = () => {};
            setUpApp(app, db, _web3Provider);

            const response = await request(app)
                .get('/alice.eth')
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            const status = response.status;

            expect(status).toBe(400);
            expect(response.body.message).toBe(
                `could not get profile for alice.eth. Unable to resolve address`,
            );
        });
    });

    describe('submitUserProfile', () => {
        it('Returns 200 if user profile creation was successful', async () => {
            const mnemonic =
                'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol';

            const wallet = ethers.Wallet.fromMnemonic(mnemonic);

            // this provider must return the address of the wallet when resolveName is called
            const _web3ProviderMock = {
                resolveName: async () => wallet.address,
            };
            // the db must return null when getAccount is called
            const _dbMock = {
                getAccount: async (ensName: string) => Promise.resolve(null),
                setAccount: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getIdEnsName: async (ensName: string) => ensName,
            };

            const app = express();
            setUpApp(app, _dbMock as any, _web3ProviderMock as any);

            const userProfile: UserProfile = {
                publicSigningKey: '2',
                publicEncryptionKey: '1',
                deliveryServices: [],
            };

            const createUserProfileMessage = getProfileCreationMessage(
                stringify(userProfile),
                wallet.address,
            );
            const signature = await wallet.signMessage(
                createUserProfileMessage,
            );

            const signedUserProfile = {
                profile: userProfile,
                signature,
            };

            const response = await request(app)
                .post(`/${wallet.address}`)
                .send(signedUserProfile);

            const status = response.status;

            expect(status).toBe(200);
        });
        it('Returns 400 if profile signature is wrong', async () => {
            const mnemonic =
                'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol';

            const wallet = ethers.Wallet.fromMnemonic(mnemonic);

            // this provider must return the address of the wallet when resolveName is called
            const _web3ProviderMock = {
                resolveName: async () => wallet.address,
            };
            // the db must return null when getAccount is called
            const _dbMock = {
                getAccount: async (ensName: string) => Promise.resolve(null),
                setAccount: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getIdEnsName: async (ensName: string) => ensName,
            };

            const app = express();
            setUpApp(app, _dbMock as any, _web3ProviderMock as any);

            const userProfile: UserProfile = {
                publicSigningKey: '2',
                publicEncryptionKey: '1',
                deliveryServices: [],
            };
            //sign something else
            const signature = await wallet.signMessage('0x1234');

            const signedUserProfile = {
                profile: userProfile,
                signature,
            };

            const response = await request(app)
                .post(`/${wallet.address}`)
                .send(signedUserProfile);

            const status = response.status;

            expect(status).toBe(400);
            expect(response.body.message).toBe("Couldn't store profile");
        });
        it('Returns 400 if addr cannot be resolved', async () => {
            const mnemonic =
                'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol';

            const wallet = ethers.Wallet.fromMnemonic(mnemonic);

            // this provider must return the address of the wallet when resolveName is called
            const _web3ProviderMock = {
                resolveName: async () => null,
            };
            // the db must return null when getAccount is called
            const _dbMock = {
                getAccount: async (ensName: string) => Promise.resolve(null),
                setAccount: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getIdEnsName: async (ensName: string) => ensName,
            };

            const app = express();
            setUpApp(app, _dbMock as any, _web3ProviderMock as any);

            const userProfile: UserProfile = {
                publicSigningKey: '2',
                publicEncryptionKey: '1',
                deliveryServices: [],
            };

            const createUserProfileMessage = getProfileCreationMessage(
                stringify(userProfile),
                wallet.address,
            );
            const signature = await wallet.signMessage(
                createUserProfileMessage,
            );

            const signedUserProfile = {
                profile: userProfile,
                signature,
            };

            const response = await request(app)
                .post(`/rando.eth`)
                .send(signedUserProfile);

            const status = response.status;

            expect(status).toBe(400);
            expect(response.body.message).toBe(
                `could not submit profile for rando.eth. Unable to resolve address`,
            );
        });

        it('Returns 400 if schema is invalid', async () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;
            const app = express();
            setUpApp(app, await createDbMock(), web3Provider);

            const userProfile: UserProfile = {
                publicSigningKey: '2',
                publicEncryptionKey: '1',
                deliveryServices: [],
            };

            const mnemonic =
                'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol';

            const wallet = ethers.Wallet.fromMnemonic(mnemonic);

            const signature = await wallet.signMessage(stringify(userProfile));

            const signedUserProfile = {
                profile: userProfile,
                signature: null,
            };

            const { status } = await request(app)
                .post(`/1234`)
                .send(signedUserProfile);

            expect(status).toBe(400);
        });
    });
});
