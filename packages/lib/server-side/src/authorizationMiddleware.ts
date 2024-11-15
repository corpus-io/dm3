import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import ethers from 'ethers';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const authJwtPayloadSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        iat: { type: 'number' },
        exp: { type: 'number' },
        nbf: { type: 'number' },
    },
    required: ['account', 'iat', 'exp', 'nbf'],
    additionalProperties: false,
};

export async function authorizationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
    ensName: string,
    hasAccount: (ensName: string) => Promise<boolean>,
    web3Provider: ethers.providers.JsonRpcProvider,
    serverSecret: string,
) {
    const normalizedEnsName = normalizeEnsName(ensName);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (
        token &&
        (await checkToken(
            web3Provider,
            hasAccount,
            normalizedEnsName,
            token,
            serverSecret,
        ))
    ) {
        next();
    } else {
        console.warn('AUTH Token check failed for ', normalizedEnsName);
        res.sendStatus(401);
    }
}

export async function checkToken(
    provider: ethers.providers.JsonRpcProvider,
    hasAccount: (ensName: string) => Promise<Boolean>,
    ensName: string,
    token: string,
    serverSecret: string,
): Promise<boolean> {
    if (!(await hasAccount(ensName.toLocaleLowerCase()))) {
        console.debug('there is no account for this ens name: ', ensName);
        return false;
    }

    //console.debug('checkToken - ensName', ensName);

    // check jwt for validity
    try {
        // will throw if signature is invalid or exp is in the past
        const jwtPayload = verify(token, serverSecret, {
            algorithms: ['HS256'],
        });

        //console.debug('checkToken - jwtPayload', jwtPayload);

        // check if payload is well formed
        if (
            typeof jwtPayload === 'string' ||
            !validateSchema(authJwtPayloadSchema, jwtPayload)
        ) {
            console.debug('jwt malformed');
            return false;
        }

        if (!jwtPayload.iat || jwtPayload.iat > Date.now() / 1000) {
            console.debug('jwt invalid: iat missing or in the future');
            return false;
        }

        if (jwtPayload.account !== ensName) {
            console.debug('jwt invalid: account mismatch');
            return false;
        }
    } catch (error) {
        console.debug(`jwt invalid: ${error}`);
        return false;
    }

    // the token is valid only if all checks passed
    return true;
}
