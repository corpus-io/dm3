import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { stringify } from 'yaml';
import { getDeliveryServiceProperties } from './getDeliveryServiceProperties';
import { NotificationChannelType } from '@dm3-org/dm3-lib-shared';

describe('ReadDeliveryServiceProperties', () => {
    let path: string;
    beforeEach(() => {
        path = resolve(__dirname, './config.test.yml');
    });

    afterEach(() => {
        if (existsSync(path)) {
            unlinkSync(path);
        }
    });

    it('Returns default DeliveryServiceProfile if config file is undefined', () => {
        const config = getDeliveryServiceProperties('/unknown-path', {
            messageTTL: 12345,
            sizeLimit: 456,
            notificationChannel: [],
            metricsCollectionIntervalInSeconds: 600,
            metricsRetentionDurationInSeconds: 172800,
        });

        expect(config).toStrictEqual({
            messageTTL: 12345,
            sizeLimit: 456,
            notificationChannel: [],
            metricsCollectionIntervalInSeconds: 600,
            metricsRetentionDurationInSeconds: 172800,
        });
    });

    it('Returns Config from path', () => {
        writeFileSync(
            path,
            stringify({
                messageTTL: 12345,
                sizeLimit: 456,
                notificationChannel: [],
                metricsCollectionIntervalInSeconds: 900,
                metricsRetentionDurationInSeconds: 259200,
            }),
            { encoding: 'utf-8' },
        );
        const config = getDeliveryServiceProperties(path);

        expect(config).toStrictEqual({
            messageTTL: 12345,
            sizeLimit: 456,
            notificationChannel: [],
            metricsCollectionIntervalInSeconds: 900,
            metricsRetentionDurationInSeconds: 259200,
        });
    });

    it('Adds default properties if config.yml is not fully specified', () => {
        writeFileSync(
            path,
            stringify({
                messageTTL: 12345,
                notificationChannel: [
                    {
                        type: NotificationChannelType.EMAIL,
                        config: {
                            host: 'mail.alice.com',
                            port: 465,
                            secure: true,
                            auth: {
                                user: 'foo',
                                pass: 'bar',
                            },
                            senderAddress: 'mail@dm3.io',
                        },
                    },
                ],
                metricsCollectionIntervalInSeconds: 1200,
            }),
            { encoding: 'utf-8' },
        );
        const config = getDeliveryServiceProperties(path);

        expect(config).toStrictEqual({
            messageTTL: 12345,
            sizeLimit: 100000,
            notificationChannel: [
                {
                    type: NotificationChannelType.EMAIL,
                    config: {
                        host: 'mail.alice.com',
                        port: 465,
                        secure: true,
                        auth: {
                            user: 'foo',
                            pass: 'bar',
                        },
                        senderAddress: 'mail@dm3.io',
                    },
                },
            ],
            metricsCollectionIntervalInSeconds: 1200,
            metricsRetentionDurationInSeconds: 60 * 60 * 24 * 10,
        });
    });

    it('Adds email channel from config.yml file & rest from default properties', () => {
        writeFileSync(
            path,
            stringify({
                notificationChannel: [
                    {
                        type: NotificationChannelType.EMAIL,
                        config: {
                            host: 'mail.alice.com',
                            port: 465,
                            secure: true,
                            auth: {
                                user: 'foo',
                                pass: 'bar',
                            },
                            senderAddress: 'mail@dm3.io',
                        },
                    },
                ],
            }),
            { encoding: 'utf-8' },
        );
        const config = getDeliveryServiceProperties(path);

        expect(config).toStrictEqual({
            messageTTL: 0,
            sizeLimit: 100000,
            notificationChannel: [
                {
                    type: NotificationChannelType.EMAIL,
                    config: {
                        host: 'mail.alice.com',
                        port: 465,
                        secure: true,
                        auth: {
                            user: 'foo',
                            pass: 'bar',
                        },
                        senderAddress: 'mail@dm3.io',
                    },
                },
            ],
            metricsCollectionIntervalInSeconds: 60 * 60 * 24,
            metricsRetentionDurationInSeconds: 60 * 60 * 24 * 10,
        });
    });

    it('Adds push notification channel from config.yml file & rest from default properties', () => {
        writeFileSync(
            path,
            stringify({
                notificationChannel: [
                    {
                        type: NotificationChannelType.PUSH,
                        config: {
                            vapidEmailId: 'test@gmail.com',
                            publicVapidKey: 'dbiwqeqwewqosa',
                            privateVapidKey: 'wqieyiwqeqwnsd',
                        },
                    },
                ],
            }),
            { encoding: 'utf-8' },
        );
        const config = getDeliveryServiceProperties(path);

        expect(config).toStrictEqual({
            messageTTL: 0,
            sizeLimit: 100000,
            notificationChannel: [
                {
                    type: NotificationChannelType.PUSH,
                    config: {
                        vapidEmailId: 'test@gmail.com',
                        publicVapidKey: 'dbiwqeqwewqosa',
                        privateVapidKey: 'wqieyiwqeqwnsd',
                    },
                },
            ],
            metricsCollectionIntervalInSeconds: 60 * 60 * 24,
            metricsRetentionDurationInSeconds: 60 * 60 * 24 * 10,
        });
    });

    it('Uses default values for metrics properties if not specified', () => {
        writeFileSync(
            path,
            stringify({
                messageTTL: 54321,
                sizeLimit: 789,
            }),
            { encoding: 'utf-8' },
        );
        const config = getDeliveryServiceProperties(path);

        expect(config).toStrictEqual({
            messageTTL: 54321,
            sizeLimit: 789,
            notificationChannel: [],
            metricsCollectionIntervalInSeconds: 60 * 60 * 24,
            metricsRetentionDurationInSeconds: 60 * 60 * 24 * 10,
        });
    });
});
