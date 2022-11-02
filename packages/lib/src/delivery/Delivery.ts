import { ethers } from 'ethers';
import { UserProfile } from '../account/Account';

export interface DeliveryServiceProfile {
    publicSigningKey: string;
    publicEncryptionKey: string;
    url: string;
}

export async function getDeliveryServiceProfile({
    deliveryServices,
}: UserProfile): Promise<DeliveryServiceProfile> {
    const DELIVERY_SERVICE_PROFILE_KEY = 'eth.dm3.deliveryService';

    const ensResolver = await ethers
        .getDefaultProvider()
        //Todo Implement deliveryService lookup algorithm #293
        .getResolver(deliveryServices[0]);

    if (!ensResolver) {
        throw 'Unknown ENS name';
    }

    const profileString = await ensResolver?.getText(
        DELIVERY_SERVICE_PROFILE_KEY,
    );

    const deliveryServiceProfile = JSON.parse(
        profileString,
    ) as DeliveryServiceProfile;

    const { publicEncryptionKey, publicSigningKey, url } =
        deliveryServiceProfile;

    //Todo merge ipfs lookup branch to use reolver here as well
    if (!publicEncryptionKey || !publicSigningKey || !url) {
        throw 'invalid profile';
    }

    return deliveryServiceProfile;
}
