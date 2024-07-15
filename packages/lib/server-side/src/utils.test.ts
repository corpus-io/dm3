import bodyParser from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';
import request from 'supertest';
import winston from 'winston';
import { auth } from './utils';

const serverSecret = 'testSecret';
winston.loggers.add('default', {
    transports: [new winston.transports.Console({ level: 'silly' })],
});

describe('Utils', () => {
    describe('Auth', () => {
        it('Returns 200 if token is valid', async () => {
            const token = sign({ account: 'alice.eth' }, serverSecret, {
                expiresIn: '1h',
                notBefore: 0,
            });

            const getSession = async (accountAddress: string) =>
                Promise.resolve({
                    signedUserProfile: {},
                    token: 'testToken',
                    createdAt: new Date().getTime(),
                });
            const setSession = async (_: string, __: any) => {
                return (_: any, __: any, ___: any) => {};
            };

            const db = {
                getSession,
                setSession,
            };

            const web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            const app = express();
            const router = express.Router();
            app.use(bodyParser.json());
            app.use(router);
            router.param(
                'address',
                async (
                    req: Request,
                    res: Response,
                    next: NextFunction,
                    ensName: string,
                ) => {
                    auth(
                        req,
                        res,
                        next,
                        ensName,
                        db as any,
                        web3Provider as any,
                        serverSecret,
                    );
                },
            );

            //Mock request auth protected
            router.get('/:address', (req, res) => {
                return res.send(200);
            });

            const { status, body } = await request(app)
                .get('/alice.eth')
                .set({ authorization: 'Bearer ' + token })
                .send();

            expect(status).toBe(200);
        });
        it('Returns 401 if account is missing', async () => {
            const token = sign({}, serverSecret, {
                expiresIn: '1h',
                notBefore: 0,
            });

            const getSession = async (accountAddress: string) =>
                Promise.resolve({
                    signedUserProfile: {},
                    token: 'testToken',
                    createdAt: new Date().getTime(),
                });
            const setSession = async (_: string, __: any) => {
                return (_: any, __: any, ___: any) => {};
            };

            const db = {
                getSession,
                setSession,
            };

            const web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            const app = express();
            const router = express.Router();
            app.use(bodyParser.json());
            app.use(router);
            router.param(
                'address',
                async (
                    req: Request,
                    res: Response,
                    next: NextFunction,
                    ensName: string,
                ) => {
                    auth(
                        req,
                        res,
                        next,
                        ensName,
                        db as any,
                        web3Provider as any,
                        serverSecret,
                    );
                },
            );

            //Mock request auth protected
            router.get('/:address', (req, res) => {
                return res.send(200);
            });

            const { status, body } = await request(app)
                .get('/alice.eth')
                .set({ authorization: 'Bearer ' + token })
                .send();

            expect(status).toBe(401);
        });
        it('Returns 401 if account is unknown', async () => {
            const token = sign({ account: 'alice.eth' }, serverSecret, {
                expiresIn: '1h',
            });
            const db = {
                getSession: async (accountAddress: string) =>
                    Promise.resolve(null),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
            };

            const web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            const app = express();
            const router = express.Router();
            app.use(bodyParser.json());
            app.use(router);
            router.param(
                'address',
                async (
                    req: Request,
                    res: Response,
                    next: NextFunction,
                    ensName: string,
                ) => {
                    auth(
                        req,
                        res,
                        next,
                        ensName,
                        db as any,
                        web3Provider as any,
                        serverSecret,
                    );
                },
            );

            //Mock request auth protected
            router.get('/:address', (req, res) => {
                return res.send(200);
            });

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            app.locals.logger = {
                warn: (_: string) => {},
            };

            const { status, body } = await request(app)
                .get('/0x25A643B6e52864d0eD816F1E43c0CF49C83B8292')
                .set({ authorization: 'Bearer ' + token })

                .send();

            expect(status).toBe(401);
        });
        it('Returns 401 if token is from wrong account', async () => {
            const token = sign({ account: 'some.other.name' }, serverSecret, {
                expiresIn: '1h',
            });
            const db = {
                getSession: async (accountAddress: string) =>
                    Promise.resolve({
                        signedUserProfile: {},
                        token: 'foo',
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
            };

            const web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            const app = express();
            const router = express.Router();
            app.use(bodyParser.json());
            app.use(router);
            router.param(
                'address',
                async (
                    req: Request,
                    res: Response,
                    next: NextFunction,
                    ensName: string,
                ) => {
                    auth(
                        req,
                        res,
                        next,
                        ensName,
                        db as any,
                        web3Provider as any,
                        serverSecret,
                    );
                },
            );

            //Mock request auth protected
            router.get('/:address', (req, res) => {
                return res.send(200);
            });

            const { status, body } = await request(app)
                .get('/0x25A643B6e52864d0eD816F1E43c0CF49C83B8292')
                .set({ authorization: 'Bearer ' + token })

                .send();

            expect(status).toBe(401);
        });
        it('Returns 401 if token is expired or exp is missing', async () => {
            expect.assertions(2);
            let token = sign({ account: 'some.other.name' }, serverSecret, {
                expiresIn: '1s', // valid for 1 second
            });
            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat
            ) {
                throw Error('Invalid token');
            }

            token = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp - 1000, // expired
                    iat: tokenBody.iat,
                },
                serverSecret,
            );

            const db = {
                getSession: async (accountAddress: string) =>
                    Promise.resolve({
                        signedUserProfile: {},
                        token: 'foo',
                        createdAt: 1,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
            };

            const web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            const app = express();
            const router = express.Router();
            app.use(bodyParser.json());
            app.use(router);
            router.param(
                'address',
                async (
                    req: Request,
                    res: Response,
                    next: NextFunction,
                    ensName: string,
                ) => {
                    auth(
                        req,
                        res,
                        next,
                        ensName,
                        db as any,
                        web3Provider as any,
                        serverSecret,
                    );
                },
            );

            //Mock request auth protected
            router.get('/:address', (req, res) => {
                return res.send(200);
            });

            const { status, body } = await request(app)
                .get('/0x25A643B6e52864d0eD816F1E43c0CF49C83B8292')
                .set({ authorization: 'Bearer ' + token })

                .send();

            expect(status).toBe(401);

            // check what happens if exp is missing
            token = sign(
                {
                    account: tokenBody.account,
                    //exp: tokenBody.exp - 1000, // expired
                    iat: tokenBody.iat,
                },
                serverSecret,
            );

            const { status: status2 } = await request(app)
                .get('/0x25A643B6e52864d0eD816F1E43c0CF49C83B8292')
                .set({ authorization: 'Bearer ' + token })

                .send();

            expect(status2).toBe(401);
        });
        it('Returns 401 if token issuance date is in the future or missing', async () => {
            expect.assertions(2);
            let token = sign({ account: 'some.other.name' }, serverSecret, {
                expiresIn: '1h',
                notBefore: 0,
            });
            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token');
            }
            // create invalid token
            token = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    iat: tokenBody.iat + 1000, // issued in the future
                    nbf: tokenBody.nbf,
                },
                serverSecret,
            );
            const db = {
                getSession: async (accountAddress: string) =>
                    Promise.resolve({
                        signedUserProfile: {},
                        token: 'foo',
                        createdAt: 1,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
            };

            const web3Provider = {
                resolveName: async () =>
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
            };

            const app = express();
            const router = express.Router();
            app.use(bodyParser.json());
            app.use(router);
            router.param(
                'address',
                async (
                    req: Request,
                    res: Response,
                    next: NextFunction,
                    ensName: string,
                ) => {
                    auth(
                        req,
                        res,
                        next,
                        ensName,
                        db as any,
                        web3Provider as any,
                        serverSecret,
                    );
                },
            );

            //Mock request auth protected
            router.get('/:address', (req, res) => {
                return res.send(200);
            });

            const { status, body } = await request(app)
                .get('/0x25A643B6e52864d0eD816F1E43c0CF49C83B8292')
                .set({ authorization: 'Bearer ' + token })

                .send();

            expect(status).toBe(401);

            // check what happens if iat is missing
            token = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    nbf: tokenBody.nbf,
                    // iat is missing
                },
                serverSecret,
            );

            const { status: status2 } = await request(app)
                .get('/0x25A643B6e52864d0eD816F1E43c0CF49C83B8292')
                .set({ authorization: 'Bearer ' + token })

                .send();

            expect(status2).toBe(401);
        });
    });
});
