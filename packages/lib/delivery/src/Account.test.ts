import { checkToken, generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import { sign, verify } from 'jsonwebtoken';

const serverSecret = 'veryImportantSecretToGenerateAndValidateJSONWebTokens';
// create valid jwt
const token = generateAuthJWT('alice.eth', serverSecret);

describe('Account', () => {
    describe('checkToken with state', () => {
        it('Should return true if the jwt is valid', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                token,
                serverSecret,
            );

            expect(isValid).toBe(true);
        });

        it('Should return false if no account exists for the account ', async () => {
            const hasAccount = (_: string) => Promise.resolve(false);

            const isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                token,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });

        it('Should return false if the token is signed with a different secret ', async () => {
            const token = generateAuthJWT('alice.eth', 'attackersSecret');
            const hasAccount = (_: string) => Promise.resolve(true);

            const isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                token,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });

        it('Should return false if a account exists but the token is expired ', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const oneMinuteAgo = new Date().getTime() / 1000 - 60;
            // this token expired a minute ago
            const _token = sign(
                {
                    account: 'alice.eth',
                    iat: oneMinuteAgo,
                    exp: oneMinuteAgo,
                    nbf: oneMinuteAgo,
                },
                serverSecret,
            );

            const isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _token,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });

        it('Should return false if token issuance date is in the future ', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

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

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }
            // create invalid token
            const _token = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    nbf: tokenBody.nbf + 2, // 2 to avoid race conditions
                    iat: tokenBody.iat + 2, // issued in the future
                },
                serverSecret,
            );

            const isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _token,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });
    });
    describe('checkToken is not missing information', () => {
        it('Should return false if iat is missing', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token to begin with');
            }

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }

            // create invalid token
            let _invalidToken = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    // nbf, iat missing. If we remove only iat, the sign command will add it again
                },
                serverSecret,
            );

            let isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _invalidToken,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });

        it('Should return false if nbf is missing', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token to begin with');
            }

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }

            // create invalid token
            let _invalidToken = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    // nbf missing.
                    iat: tokenBody.iat,
                },
                serverSecret,
            );

            let isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _invalidToken,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });

        it('Should return false if key "account" is missing', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token to begin with');
            }

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }

            // create invalid token
            let _invalidToken = sign(
                {
                    // account missing
                    exp: tokenBody.exp,
                    nbf: tokenBody.nbf,
                    iat: tokenBody.iat,
                },
                serverSecret,
            );

            let isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _invalidToken,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });

        it('Should return false if exp is missing', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token to begin with');
            }

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }

            // create invalid token
            let _invalidToken = sign(
                {
                    account: tokenBody.account,
                    // exp missing
                    nbf: tokenBody.nbf,
                    iat: tokenBody.iat,
                },
                serverSecret,
            );

            let isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _invalidToken,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });
    });
    describe('checkToken does not contain unexpected keys', () => {
        it('Should return false if challenge is present', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token to begin with');
            }

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }

            // create invalid token
            let _invalidToken = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    nbf: tokenBody.nbf,
                    iat: tokenBody.iat,
                    challenge: 'foo',
                },
                serverSecret,
            );

            let isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _invalidToken,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });
        it('Should return false if some additional key is present', async () => {
            const hasAccount = (_: string) => Promise.resolve(true);

            const tokenBody = verify(token, serverSecret);
            if (
                !tokenBody ||
                typeof tokenBody === 'string' ||
                !tokenBody.exp ||
                !tokenBody.account ||
                !tokenBody.iat ||
                !tokenBody.nbf
            ) {
                throw Error('Invalid token to begin with');
            }

            // ensure token is accepted as valid before changes
            if (
                !(await checkToken(
                    {
                        resolveName: async () =>
                            '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                    } as any,
                    hasAccount,
                    'alice.eth',
                    token,
                    serverSecret,
                ))
            ) {
                throw Error('Token should be valid');
            }

            // create invalid token
            let _invalidToken = sign(
                {
                    account: tokenBody.account,
                    exp: tokenBody.exp,
                    nbf: tokenBody.nbf,
                    iat: tokenBody.iat,
                    anyKey: 'foo',
                },
                serverSecret,
            );

            let isValid = await checkToken(
                {
                    resolveName: async () =>
                        '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                } as any,
                hasAccount,
                'alice.eth',
                _invalidToken,
                serverSecret,
            );

            expect(isValid).toBe(false);
        });
    });
});
