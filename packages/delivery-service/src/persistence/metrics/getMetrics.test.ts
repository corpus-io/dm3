import { getMetrics } from './getMetrics';
import { Redis, RedisPrefix } from '../getDatabase';

describe('getMetrics', () => {
    let mockRedis: jest.Mocked<Redis>;
    const mockDate = new Date('2023-04-01T12:00:00Z');
    //@ts-ignore
    const mockDeliveryServiceProperties: DeliveryServiceProperties = {
        metricsCollectionIntervalInSeconds: 3600,
        metricsRetentionDurationInSeconds: 864000,
    };

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(mockDate);
        mockRedis = {
            keys: jest.fn(),
            get: jest.fn(),
        } as unknown as jest.Mocked<Redis>;
    });

    it('should return an empty array when no metrics are found', async () => {
        mockRedis.keys.mockResolvedValue([]);

        const getMetricsFunc = getMetrics(mockRedis);
        const result = await getMetricsFunc(mockDeliveryServiceProperties);

        expect(result).toEqual([]);
    });

    it('should return metrics for all available intervals', async () => {
        const mockKeys = Array.from({ length: 24 }, (_, i) => {
            const timestamp = 1680307200 - i * 3600;
            return `${RedisPrefix.MetricsMessageCount}${timestamp}`;
        });
        mockRedis.keys.mockResolvedValue(mockKeys);
        mockRedis.get.mockImplementation((key: string) => {
            if (key.includes(RedisPrefix.MetricsMessageCount))
                return Promise.resolve('10');
            if (key.includes(RedisPrefix.MetricsMessageSize))
                return Promise.resolve('1000');
            if (key.includes(RedisPrefix.MetricsNotificationCount))
                return Promise.resolve('5');
            return Promise.resolve(null);
        });

        const getMetricsFunction = getMetrics(mockRedis);
        const result = await getMetricsFunction(mockDeliveryServiceProperties);

        expect(mockRedis.keys).toHaveBeenCalledWith(
            `${RedisPrefix.MetricsMessageCount}*`,
        );
        expect(result).toHaveLength(24);
        expect(result[0]).toEqual({
            timestampStart: 1680307200,
            durationSeconds: 3600,
            messageCount: 10,
            messageSizeBytes: 1000,
            notificationCount: 5,
        });
    });

    it('should handle missing data', async () => {
        mockRedis.keys.mockResolvedValue([
            `${RedisPrefix.MetricsMessageCount}1680307200`,
        ]);
        //@ts-ignore
        mockRedis.get.mockImplementation((key) => {
            console.log('key', key);
            //@ts-ignore
            const [prefix] = key.split(':');
            switch (prefix + ':') {
                case RedisPrefix.MetricsMessageCount:
                    return Promise.resolve('10');
                case RedisPrefix.MetricsMessageSize:
                    return Promise.resolve(null);
                case RedisPrefix.MetricsNotificationCount:
                    return Promise.resolve('5');
                default:
                    return Promise.resolve(null);
            }
        });

        const getMetricsFunction = getMetrics(mockRedis);
        const result = await getMetricsFunction(mockDeliveryServiceProperties);
        console.log(result);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            timestampStart: 1680307200,
            durationSeconds: 3600,
            messageCount: 10,
            messageSizeBytes: 0,
            notificationCount: 5,
        });
    });

    it('should censor the current interval', async () => {
        const currentTimestamp = Math.floor(mockDate.getTime() / 1000);
        const mockKeys = [
            `${RedisPrefix.MetricsMessageCount}${currentTimestamp}`,
            `${RedisPrefix.MetricsMessageCount}${currentTimestamp - 3600}`,
        ];
        mockRedis.keys.mockResolvedValue(mockKeys);
        mockRedis.get.mockResolvedValue('10');

        const getMetricsFunction = getMetrics(mockRedis);
        const result = await getMetricsFunction(mockDeliveryServiceProperties);

        expect(result).toHaveLength(1);
        expect(result[0].timestampStart).toBe(currentTimestamp - 3600); // 2023-04-01T11:00:00.000Z
        expect(
            result.every(
                (metric) =>
                    metric.timestampStart !==
                    Math.floor(mockDate.getTime() / 1000),
            ),
        ).toBe(true);
    });
});
