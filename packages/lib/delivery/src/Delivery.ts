import { NotificationChannel } from '@dm3-org/dm3-lib-shared';

export interface DeliveryServiceProperties {
    messageTTL: number;
    //Number of bytes an envelop object should not exceed
    sizeLimit: number;
    notificationChannel: NotificationChannel[];
    metricsCollectionIntervalInSeconds: number;
    metricsRetentionDurationInSeconds: number;
}
