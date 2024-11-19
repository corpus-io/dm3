import {
    getDeliveryServiceProfile,
    DeliveryServiceProfile,
    Account,
} from '@dm3-org/dm3-lib-profile';
import axios from 'axios';
import { ethers } from 'ethers';
import { Contact } from '../types';

export interface FetchDsProfilesResult {
    account: Account;
    deliveryServiceProfiles: DeliveryServiceProfile[];
}

export const fetchDsProfiles = async (
    provider: ethers.providers.JsonRpcProvider,
    account: Account,
): Promise<FetchDsProfilesResult> => {
    const deliveryServiceEnsNames = account.profile?.deliveryServices ?? [];
    if (deliveryServiceEnsNames.length === 0) {
        //If there is no DS profile the message will be stored at the client side until the recipient has created an account
        console.debug(
            '[fetchDeliveryServiceProfile] account has no delivery-service profile',
        );
        return {
            account,
            deliveryServiceProfiles: [],
        };
    }

    //Resolve every ds profile in the contacts profile
    const dsProfilesWithUnknowns = await Promise.all(
        deliveryServiceEnsNames.map((deliveryServiceEnsName: string) => {
            console.debug('fetch ds profile of', deliveryServiceEnsName);
            return getDeliveryServiceProfile(
                deliveryServiceEnsName,
                provider!,
                async (url: string) => (await axios.get(url)).data,
            );
        }),
    );
    //filter unknown profiles. A profile if unknown if the profile could not be fetched. We don't want to deal with them in the UI
    const deliveryServiceProfiles = dsProfilesWithUnknowns.filter(
        (profile): profile is DeliveryServiceProfile => profile !== undefined,
    );

    return {
        account,
        deliveryServiceProfiles,
    };
};
