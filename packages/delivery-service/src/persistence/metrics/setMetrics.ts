import { Redis, RedisPrefix } from '../getDatabase';
import { DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';
import { getCurrentIntervalTimestamp } from './getCurrentIntervalTimestamp';

export function countMessage(redis: Redis) {
    return async (
        messageSizeBytes: number,
        deliveryServiceProperties: DeliveryServiceProperties,
    ) => {
        if (deliveryServiceProperties.metricsRetentionDurationInSeconds <= 0) {
            // Metrics are disabled
            return;
        }

        const timestamp = getCurrentIntervalTimestamp(
            deliveryServiceProperties.metricsCollectionIntervalInSeconds,
        );

        console.log(
            'countMessage at',
            timestamp,
            ' with size ',
            messageSizeBytes,
        );

        // Increment the message count, starting at 0 if the key doesn't exist
        await redis.incrBy(`${RedisPrefix.MetricsMessageCount}${timestamp}`, 1);

        // Increment the message size bytes, starting at 0 if the key doesn't exist
        await redis.incrBy(
            `${RedisPrefix.MetricsMessageSize}${timestamp}`,
            messageSizeBytes,
        );

        // Set expiration. After this time the metrics are automatically deleted by redis.
        await redis.expire(
            `${RedisPrefix.MetricsMessageCount}${timestamp}`,
            deliveryServiceProperties.metricsRetentionDurationInSeconds,
        );
        await redis.expire(
            `${RedisPrefix.MetricsMessageSize}${timestamp}`,
            deliveryServiceProperties.metricsRetentionDurationInSeconds,
        );

        console.log('countMessage of size', messageSizeBytes, 'at', timestamp);
    };
}

export function countNotification(redis: Redis) {
    return async (deliveryServiceProperties: DeliveryServiceProperties) => {
        if (deliveryServiceProperties.metricsRetentionDurationInSeconds <= 0) {
            // Metrics are disabled
            return;
        }

        const timestamp = getCurrentIntervalTimestamp(
            deliveryServiceProperties.metricsCollectionIntervalInSeconds,
        );

        // Increment the notification count, starting at 0 if the key doesn't exist
        await redis.incrBy(
            `${RedisPrefix.MetricsNotificationCount}${timestamp}`,
            1,
        );

        // Set expiration. After this time the metrics are automatically deleted by redis.
        await redis.expire(
            `${RedisPrefix.MetricsNotificationCount}${timestamp}`,
            deliveryServiceProperties.metricsRetentionDurationInSeconds,
        );

        console.log('countNotification at', timestamp);
    };
}
