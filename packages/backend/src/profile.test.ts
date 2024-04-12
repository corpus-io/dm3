import { Session, spamFilter } from '@dm3-org/dm3-lib-delivery';
import {
    UserProfile,
    getProfileCreationMessage,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import request from 'supertest';
import winston from 'winston';
import { IDatabase } from './persistence/getDatabase';
import profile from './profile';
import storage from './storage';

global.logger = winston.createLogger({
    transports: [new winston.transports.Console()],
});

const web3ProviderMock: ethers.providers.JsonRpcProvider =
    new ethers.providers.JsonRpcProvider();

let mockToken = 'mockAuthToken';

const setUpApp = async (
    app: express.Express,
    db: IDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
) => {
    app.use(bodyParser.json());
    const server = http.createServer(app);
    const io = new Server(server, {});
    app.use(profile(db, io, web3Provider));
};

const createDbMock = async () => {
    const sessionMocked = {
        challenge: '123',
        token: mockToken,
        signedUserProfile: {},
    } as Session & { spamFilterRules: spamFilter.SpamFilterRules };

    const dbMock = {
        getSession: async (ensName: string) =>
            Promise.resolve<
                Session & {
                    spamFilterRules: spamFilter.SpamFilterRules;
                }
            >(sessionMocked),
        setSession: async (_: string, __: Session) => {},
        getIdEnsName: async (ensName: string) => ensName,
    };

    return dbMock as any;
};

describe('Profile', () => {
    describe('getProfile', () => {
        it('Returns 200 if user profile exists', async () => {
            const app = express();

            const db = await createDbMock();
            // I don't know why this function is needed in this test.
            // Remove it after storage migration.
            db.getUserStorage = () => {};
            app.use(storage(db, web3ProviderMock));
            setUpApp(app, db, web3ProviderMock);

            const response = await request(app)
                .get('/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870')
                .set({
                    authorization: `Bearer ${mockToken}`,
                })
                .send();

            console.log(response.error);

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
            // the db must return null when getSession is called
            const _dbMock = {
                getSession: async (ensName: string) => Promise.resolve(null),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getPending: (_: any) => [],
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

            // log status message
            console.log(response.info);
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
