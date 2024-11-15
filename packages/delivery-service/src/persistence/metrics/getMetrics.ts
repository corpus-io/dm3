import { DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';
import { Redis, RedisPrefix } from '../getDatabase';
import { getCurrentIntervalTimestamp } from './getCurrentIntervalTimestamp';
import { IntervalMetric } from './metricTypes';

/**
 * Get the metrics from the database, excluding the current interval.
 * (The current interval is excluded because monitoring it closely allows
 * third parties to gain too much information about the current activity on the
 * DM3 network.)
 * @param redis - The Redis instance.
 * @returns The metrics object.
 */
export function getMetrics(
    redis: Redis,
): (
    deliveryServiceProperties: DeliveryServiceProperties,
) => Promise<IntervalMetric[]> {
    return async (deliveryServiceProperties: DeliveryServiceProperties) => {
        const metrics: IntervalMetric[] = [];
        const messageCountKeys = await redis.keys(
            `${RedisPrefix.MetricsMessageCount}*`,
        );

        const currentTimestamp = getCurrentIntervalTimestamp(
            deliveryServiceProperties.metricsCollectionIntervalInSeconds,
        );

        for (const key of messageCountKeys) {
            const timestamp = parseInt(key.split(':')[1], 10);

            // Skip the current interval
            if (String(timestamp) === currentTimestamp) {
                continue;
            }

            const messageCount = await redis.get(key);
            const messageSizeBytes = await redis.get(
                `${RedisPrefix.MetricsMessageSize}${timestamp}`,
            );
            const notificationCount = await redis.get(
                `${RedisPrefix.MetricsNotificationCount}${timestamp}`,
            );

            metrics.push({
                timestampStart: timestamp,
                durationSeconds:
                    deliveryServiceProperties.metricsCollectionIntervalInSeconds,
                messageCount: parseInt(messageCount || '0', 10),
                messageSizeBytes: parseInt(messageSizeBytes || '0', 10),
                notificationCount: parseInt(notificationCount || '0', 10),
            });
        }

        return metrics;
    };
}
