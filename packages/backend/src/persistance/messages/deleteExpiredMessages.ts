import { RedisPrefix } from '../../redis';
import { Redis } from '../getDatabase';

export function deleteExpiredMessages(
    redisClient: Redis,
): (time: number) => Promise<void> {
    return async (time: number) => {
        const conversions = await redisClient.keys(
            RedisPrefix.Conversation + '*',
        );

        await Promise.all(
            conversions.map((conversion) =>
                redisClient.zRemRangeByScore(conversion, 0, time),
            ),
        );
    };
}
