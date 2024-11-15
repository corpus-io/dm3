import { stringify } from '@dm3-org/dm3-lib-shared';
import { mockUserProfile } from '@dm3-org/dm3-lib-test-helper';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import express from 'express';
import { verify } from 'jsonwebtoken';
import request from 'supertest';
import { Authenticate } from './authenticate';
import { IAccountDatabase } from './iAccountDatabase';
import { createChallenge } from './Keys';
import { sign } from '@dm3-org/dm3-lib-crypto';

const serverSecret = 'testSecret';

const mockDbWithAccount: IAccountDatabase = {
    hasAccount: async (ensName: string) => Promise.resolve(true),
};

const mockDbWithOUTAccount: IAccountDatabase = {
    hasAccount: async (ensName: string) => Promise.resolve(false),
};

const keysA = {
    encryptionKeyPair: {
        publicKey: 'eHmMq29FeiPKfNPkSctPuZGXvV0sKeO/KZkX2nXvMgw=',
        privateKey: 'pMI77F2w3GK+omZCB4A61WDqISOOnWGXR2f/MTLbqbY=',
    },
    signingKeyPair: {
        publicKey: '+tkDQWZfv9ixBmObsf8tgTHTZajwAE9muTtFAUj2e9I=',
        privateKey:
            '+DpeBjCzICFoi743/466yJunsHR55Bhr3GnqcS4cuJX62QNBZl+/2LEGY5ux/y2BMdNlqPAAT2a5O0UBSPZ70g==',
    },
    storageEncryptionKey: '+DpeBjCzICFoi743/466yJunsHR55Bhr3GnqcS4cuJU=',
    storageEncryptionNonce: 0,
};

describe('Auth', () => {
    let user: any;
    let expectedUserProfile: any;
    let userAddress: string;
    let mockWeb3Provider: ethers.providers.StaticJsonRpcProvider;

    beforeAll(async () => {
        user = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'alice.eth',
            ['ds1.eth', 'ds2.eth'],
        );
        expectedUserProfile = user.signedUserProfile;
        userAddress = user.wallet.address;

        const mockGetEnsResolver = (_: string) =>
            Promise.resolve({
                getText: (_: string) =>
                    Promise.resolve(
                        'data:application/json,' +
                            stringify(expectedUserProfile),
                    ),
            });

        mockWeb3Provider = {
            getResolver: mockGetEnsResolver,
            resolveName: async () => userAddress,
        } as unknown as ethers.providers.StaticJsonRpcProvider;
    });

    describe('getChallenge', () => {
        describe('schema', () => {
            it('Returns 200 and a jwt if schema is valid', async () => {
                const app = express();
                app.use(bodyParser.json());
                app.use(
                    Authenticate(
                        mockDbWithAccount,
                        serverSecret,
                        mockWeb3Provider,
                    ),
                );

                const response = await request(app)
                    .get(
                        '/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870.dev-addr.dm3.eth',
                    )
                    .send();
                console.log(response);

                expect(response.status).toBe(200);

                // verify that the response is a jwt with the expected content
                const challengeJwt = response.body;
                const jwtPayload = verify(challengeJwt, serverSecret, {
                    algorithms: ['HS256'],
                });

                if (typeof jwtPayload == 'string') {
                    throw new Error('jwt contains wrong payload');
                }

                if (
                    !('account' in jwtPayload) ||
                    !jwtPayload.account ||
                    jwtPayload.account !=
                        '0x99c19ab10b9ec8ac6fcda9586e81f6b73a298870.dev-addr.dm3.eth'
                ) {
                    console.log(jwtPayload.account);
                    throw new Error('account missing or bad');
                }
                if (
                    !('challenge' in jwtPayload) ||
                    !jwtPayload.challenge ||
                    typeof jwtPayload.challenge !== 'string'
                ) {
                    console.log(jwtPayload.challenge);
                    throw new Error('challenge missing or bad');
                }
                if (
                    !('iat' in jwtPayload) ||
                    !jwtPayload.iat ||
                    jwtPayload.iat > Date.now() / 1000
                ) {
                    throw new Error('iat missing or bad');
                }
                if (
                    !('exp' in jwtPayload) ||
                    !jwtPayload.exp ||
                    jwtPayload.exp <= Date.now() / 1000
                ) {
                    throw new Error('exp missing or bad');
                }
                if (
                    !(
                        'nbf' in jwtPayload ||
                        !jwtPayload.nbf ||
                        jwtPayload.nbf > Date.now() / 1000
                    )
                ) {
                    throw new Error('nbf missing or bad');
                }
            });
        });
    });

    describe('createNewAccountToken', () => {
        describe('schema', () => {
            it('Returns 400 if signature is invalid', async () => {
                const app = express();

                app.use(bodyParser.json());
                app.use(
                    Authenticate(
                        mockDbWithAccount,
                        serverSecret,
                        mockWeb3Provider,
                    ),
                );

                // create the challenge jwt
                const challengeJwt = await createChallenge(
                    mockDbWithAccount,
                    'bob.eth',
                    serverSecret,
                );

                // signing with this keyA, but the server checks signature against user.profileKeys.signingKeyPair.privateKey,
                const signature = await sign(
                    keysA.signingKeyPair.privateKey,
                    challengeJwt,
                );

                const { status } = await request(app).post(`/1234`).send({
                    signature,
                    challenge: challengeJwt,
                });

                expect(status).toBe(400);
            });

            it('Returns 400 if params is invalid', async () => {
                const app = express();

                app.use(bodyParser.json());
                app.use(
                    Authenticate(
                        mockDbWithAccount,
                        serverSecret,
                        mockWeb3Provider,
                    ),
                );

                // create the challenge jwt
                const challengeJwt = await createChallenge(
                    mockDbWithAccount,
                    'bob.eth',
                    serverSecret,
                );

                const signature = await sign(
                    user.profileKeys.signingKeyPair.privateKey,
                    challengeJwt,
                );

                const { status } = await request(app).post(`/1234`).send({
                    // we do not provide a signature
                    challenge: challengeJwt,
                });

                expect(status).toBe(400);

                const { status: status2 } = await request(app)
                    .post(`/1234`)
                    .send({
                        signature,
                        // we do not provide a challenge
                    });
                expect(status2).toBe(400);
            });
            it('Returns 400 if body is invalid', async () => {
                const app = express();

                app.use(bodyParser.json());
                app.use(
                    Authenticate(
                        mockDbWithAccount,
                        serverSecret,
                        mockWeb3Provider,
                    ),
                );

                const { status } = await request(app).post(`/somename`).send({
                    foo: 'some content',
                });

                expect(status).toBe(400);
            });
            it('Returns 200 if schema and content is valid', async () => {
                const app = express();

                app.use(bodyParser.json());
                app.use(
                    Authenticate(
                        mockDbWithAccount,
                        serverSecret,
                        mockWeb3Provider,
                    ),
                );

                // create the challenge jwt
                const challengeJwt = await createChallenge(
                    mockDbWithAccount,
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
                    serverSecret,
                );

                const signature = await sign(
                    user.profileKeys.signingKeyPair.privateKey,
                    challengeJwt,
                );

                const { status } = await request(app)
                    .post(`/0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1`)
                    .send({
                        signature: signature,
                        challenge: challengeJwt as string,
                    });

                expect(status).toBe(200);
            });
        });
    });
});
