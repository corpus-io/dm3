import { Redis, RedisPrefix } from '../getDatabase';
import { countMessage, countNotification } from './setMetrics';
import { DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';

describe('setMetrics', () => {
    let mockRedis: jest.Mocked<Redis>;
    const mockDate = new Date('2023-04-01T12:00:00Z');
    //@ts-ignore
    const mockDeliveryServiceProperties: DeliveryServiceProperties = {
        metricsCollectionIntervalInSeconds: 3600,
        metricsRetentionDurationInSeconds: 864000,
    };

    const expectedTimestamp = '1680350400';

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(mockDate);
        mockRedis = {
            incrBy: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(1),
        } as unknown as jest.Mocked<Redis>;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('countMessage', () => {
        it('should increment message count and size, and set expiration', async () => {
            const messageSizeBytes = 100;

            const countMessageFunction = countMessage(mockRedis);

            await countMessageFunction(
                messageSizeBytes,
                mockDeliveryServiceProperties,
            );

            expect(mockRedis.incrBy).toHaveBeenCalledTimes(2);
            expect(mockRedis.incrBy).toHaveBeenCalledWith(
                `${RedisPrefix.MetricsMessageCount}${expectedTimestamp}`,
                1,
            );
            expect(mockRedis.incrBy).toHaveBeenCalledWith(
                `${RedisPrefix.MetricsMessageSize}${expectedTimestamp}`,
                messageSizeBytes,
            );

            expect(mockRedis.expire).toHaveBeenCalledTimes(2);
            expect(mockRedis.expire).toHaveBeenCalledWith(
                `${RedisPrefix.MetricsMessageCount}${expectedTimestamp}`,
                mockDeliveryServiceProperties.metricsRetentionDurationInSeconds,
            );
            expect(mockRedis.expire).toHaveBeenCalledWith(
                `${RedisPrefix.MetricsMessageSize}${expectedTimestamp}`,
                mockDeliveryServiceProperties.metricsRetentionDurationInSeconds,
            );
        });

        it('should not collect metrics when retention interval is 0', async () => {
            const messageSizeBytes = 100;
            const countMessageFunction = countMessage(mockRedis);

            const propertiesWithZeroRetention = {
                ...mockDeliveryServiceProperties,
                metricsRetentionDurationInSeconds: 0,
            };

            await countMessageFunction(
                messageSizeBytes,
                propertiesWithZeroRetention,
            );

            expect(mockRedis.incrBy).not.toHaveBeenCalled();
            expect(mockRedis.expire).not.toHaveBeenCalled();
        });
    });

    describe('countNotification', () => {
        it('should increment notification count and set expiration', async () => {
            const countNotificationFunction = countNotification(mockRedis);

            await countNotificationFunction(mockDeliveryServiceProperties);

            expect(mockRedis.incrBy).toHaveBeenCalledTimes(1);
            expect(mockRedis.incrBy).toHaveBeenCalledWith(
                `${RedisPrefix.MetricsNotificationCount}${expectedTimestamp}`,
                1,
            );

            expect(mockRedis.expire).toHaveBeenCalledTimes(1);
            expect(mockRedis.expire).toHaveBeenCalledWith(
                `${RedisPrefix.MetricsNotificationCount}${expectedTimestamp}`,
                mockDeliveryServiceProperties.metricsRetentionDurationInSeconds,
            );
        });

        it('should not collect metrics when retention interval is 0', async () => {
            const countNotificationFunction = countNotification(mockRedis);

            const propertiesWithZeroRetention = {
                ...mockDeliveryServiceProperties,
                metricsRetentionDurationInSeconds: 0,
            };

            await countNotificationFunction(propertiesWithZeroRetention);

            expect(mockRedis.incrBy).not.toHaveBeenCalled();
            expect(mockRedis.expire).not.toHaveBeenCalled();
        });
    });
});
