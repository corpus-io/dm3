import { Account } from '@dm3-org/dm3-lib-delivery';
import { ethers } from 'ethers';
import { Redis, RedisPrefix } from '../getDatabase';

export function getAccount(redis: Redis) {
    return async (address: string) => {
        const account = await redis.get(
            RedisPrefix.Account + ethers.utils.getAddress(address),
        );

        if (!account) {
            console.debug('there is no account for this address: ', address);
            return null;
        }

        return JSON.parse(account) as Account;
    };
}
