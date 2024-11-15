import { stringify } from '@dm3-org/dm3-lib-shared';
import { Redis, RedisPrefix } from '../getDatabase';
import { getMessages } from './getMessages';

/**
 * Function to acknowledge synchronization of messages.
 * It removes the message with the given hash from the Redis sorted set.
 *
 * @param {Redis} redis - The Redis client instance.
 * @return {Function} - Returns an async function that takes a conversationId and a messageHash.
 */
export function syncAcknowledge(redis: Redis) {
    return async (
        conversationId: string,
        messageHash: string,
    ): Promise<boolean> => {
        //DEFAULT PAGE SIZE. Should be large enough to capture the entire set
        const PAGE_SIZE = 100000;
        //deleting a message by its id is not possible in redis using a sorted set.
        //hence we have to fetch all the messages and then remove the message from the sorted set.
        const messages = await getMessages(redis)(conversationId, 0, PAGE_SIZE);

        //find the message with the given hash
        const message = messages.find(
            (m) => m.metadata.messageHash === messageHash,
        );

        //return if the message is not found
        if (!message) {
            console.log('message not found ', messageHash);
            return false;
        }

        //remove the message from the sorted set
        const res = await redis.zRem(
            RedisPrefix.Conversation + conversationId,
            stringify(message),
        );
        //returns true if the message is removed successfully
        return !!res;
    };
}
