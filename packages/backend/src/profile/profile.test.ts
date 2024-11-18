import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import {
    UserProfile,
    getProfileCreationMessage,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import { Account } from '@prisma/client';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import express from 'express';
import http from 'http';
import request from 'supertest';
import { IBackendDatabase } from '../persistence/getDatabase';
import profile from './profile';
import storage from '../storage';
import { mockUserProfile } from '@dm3-org/dm3-lib-test-helper';

// todo: create a web3 provider mock that returns a resolver and that thren returns a text when the respective functions
// are called
const web3ProviderMock: ethers.providers.JsonRpcProvider =
    new ethers.providers.JsonRpcProvider();

const serverSecret = 'veryImportantSecretToGenerateAndValidateJSONWebTokens';

let token = generateAuthJWT('alice.eth', serverSecret);

const setUpApp = async (
    app: express.Express,
    db: IBackendDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    serverSecret: string = 'my-secret',
    luksoProvider: ethers.providers.JsonRpcProvider = {} as ethers.providers.JsonRpcProvider,
) => {
    app.use(bodyParser.json());
    const server = http.createServer(app);
    app.use(profile(db, web3Provider, luksoProvider, serverSecret));
};

const createDbMock = async () => {
    const accountMocked = {
        id: 'alice.eth',
    } as Account;

    const dbMock = {
        getAccount: async (ensName: string) => Promise.resolve(accountMocked),
        setAccount: async (id: string) => {},
    };

    return dbMock as any;
};

describe('Profile', () => {
    describe('getProfile', () => {
        it('Returns 200 if user profile exists', async () => {
            const app = express();

            const db = await createDbMock();

            const user = await mockUserProfile(
                ethers.Wallet.createRandom(),
                'alice.eth',
                ['ds1.eth', 'ds2.eth'],
            );
            const expectedUserProfile = user.signedUserProfile;
            const userAddress = user.wallet.address;

            const mockGetEnsResolver = (_: string) =>
                Promise.resolve({
                    getText: (_: string) =>
                        Promise.resolve(
                            'data:application/json,' +
                                stringify(expectedUserProfile),
                        ),
                });

            const _web3Provider = {
                getResolver: mockGetEnsResolver,
                resolveName: async () => userAddress,
            } as unknown as ethers.providers.StaticJsonRpcProvider;

            // I don't know why this function is needed in this test.
            // Remove it after storage migration.
            db.getUserStorage = () => {};
            app.use(storage(db, _web3Provider, serverSecret));
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

        it('Returns 400 if schema is invalid', async () => {
            const app = express();
            setUpApp(app, await createDbMock(), web3ProviderMock);

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
