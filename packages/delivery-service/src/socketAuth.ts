/* eslint-disable no-console */
import { checkToken } from '@dm3-org/dm3-lib-server-side';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { ethers } from 'ethers';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import type { IDatabase } from './persistence/getDatabase';

export function socketAuth(
    db: IDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    serverSecret: string,
) {
    return async (
        socket: Socket,
        next: (err?: ExtendedError | undefined) => void,
    ) => {
        try {
            const ensName = normalizeEnsName(
                socket.handshake.auth.account.ensName,
            );
            console.log('Start WS auth for ', ensName, socket.id);

            if (
                !(await checkToken(
                    web3Provider,
                    db.hasAccount,
                    ensName,
                    socket.handshake.auth.token as string,
                    serverSecret,
                ))
            ) {
                console.log('check token has failed for WS ');
                return next(new Error('check token has failed for WS'));
            }
            const account = await db.getAccount(ensName);
            if (!account) {
                throw Error('Could not get account');
            }
            //we use account.account here as a key for setAccount here.
            //We can do this because the address is used as account when the Account has been created.
            //That saves a address lookup via ENS
            await db.setAccount(account.account, {
                ...account,
                socketId: socket.id,
            });
        } catch (e) {
            console.log('socket auth error');
            console.log(e);
            next(e as Error);
        }

        next();
    };
}
