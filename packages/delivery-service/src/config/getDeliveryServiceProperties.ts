import { parse } from 'yaml';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { logInfo, validateSchema } from '@dm3-org/dm3-lib-shared';
import { schema, DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';

const DEFAULT_CONFIG_FILE_PATH = resolve(__dirname, './../config.yml');
const DEFAULT_DELIVERY_SERVICE_PROPERTIES: DeliveryServiceProperties = {
    messageTTL: 0,
    //100Kb
    sizeLimit: 100000,
    notificationChannel: [],
    metricsCollectionIntervalInSeconds: 60 * 60 * 24, // 1 day
    metricsRetentionDurationInSeconds: 60 * 60 * 24 * 10, // 10 days
};

export function getDeliveryServiceProperties(
    path: string = DEFAULT_CONFIG_FILE_PATH,
    defaultDeliveryServiceProperties: DeliveryServiceProperties = DEFAULT_DELIVERY_SERVICE_PROPERTIES,
): DeliveryServiceProperties {
    console.log('path', DEFAULT_CONFIG_FILE_PATH);
    console.log('dirname', __dirname);
    if (!existsSync(path)) {
        logInfo('Config file not found. Default Config is used');
        return defaultDeliveryServiceProperties;
    }

    const yamlString = readFileSync(path, { encoding: 'utf-8' });

    const deliveryServiceProfile = parse(yamlString);

    const isSchemaValid = validateSchema(
        // eslint-disable-next-line max-len
        //The interface DeliveryServiceProperties requires all properties to be non-null. But since we are accepting a partially filled config.yml we are overwriting the required fields so basically no property is required at all. This can be done because every missing property is replaced by a default property
        {
            ...schema.DeliveryServiceProperties,
            definitions: {
                ...schema.DeliveryServiceProperties.definitions,
                DeliveryServiceProperties: {
                    ...schema.DeliveryServiceProperties.definitions
                        .DeliveryServiceProperties,
                    required: [],
                },
            },
        },
        deliveryServiceProfile,
    );

    if (!isSchemaValid) {
        throw Error('Invalid config.yml');
    }

    return {
        ...defaultDeliveryServiceProperties,
        ...parse(yamlString),
    } as DeliveryServiceProperties;
}
