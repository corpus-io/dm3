import { parse } from 'yaml';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { logInfo, validateSchema } from 'dm3-lib-shared/dist.backend';
import {
    schema,
    DeliveryServiceProperties,
} from 'dm3-lib-delivery/dist.backend';

const DEFAULT_CONFIG_FILE_PATH = resolve(__dirname, './../config.yml');
const DEFAULT_DELIVERY_SERVICE_PROPERTIES: DeliveryServiceProperties = {
    messageTTL: 0,
    //100Kb
    sizeLimit: 100000,
};

export function getDeliveryServiceProperties(
    path: string = DEFAULT_CONFIG_FILE_PATH,
    defaultDeliveryServiceProperties: DeliveryServiceProperties = DEFAULT_DELIVERY_SERVICE_PROPERTIES,
): DeliveryServiceProperties {
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
            required: [],
        },
        deliveryServiceProfile,
    );

    if (!isSchemaValid) {
        throw Error('Invalid config.yml');
    }

    const { messageTTL, sizeLimit } = {
        ...defaultDeliveryServiceProperties,
        ...parse(yamlString),
    } as DeliveryServiceProperties;

    return { messageTTL, sizeLimit };
}
