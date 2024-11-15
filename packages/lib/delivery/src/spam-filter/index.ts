import { ethers } from 'ethers';
import { DeliveryInformation } from '@dm3-org/dm3-lib-messaging';
import { ethBalanceFilterFactory } from './filter/ethBalanceFilter/EthBalanceFilter';
import { nonceFilterFactory } from './filter/nonceFilter/NonceFilter';
import { SpamFilter, SpamFilterFactory } from './filter/SpamFilter';
import { tokenBalanceFilterFactory } from './filter/tokenBalanceFilter/TokenBalanceFilter';
import { SpamFilterRules } from './SpamFilterRules';
import { Account } from '../Account';

export type { SpamFilterRules };

/**
 * All spam filters that are currently implemented.
 * A new filter can easily be added by implementing the {@see SpamFilterFactory} interface
 */
const SUPPORTED_SPAM_FILTERS: SpamFilterFactory[] = [
    nonceFilterFactory(),
    ethBalanceFilterFactory(),
    tokenBalanceFilterFactory(),
];

/**
 * Reduces many {@see SpamFilter} into one single filter function
 */
function compileSpamFilter(filter: SpamFilter[]) {
    return async (deliveryInformation: DeliveryInformation) => {
        const filterPromises = await Promise.all(
            filter.map((f) => f.filter(deliveryInformation)),
        );

        return filterPromises.reduce(
            (agg, cur) => (agg === false ? false : cur),
            true,
        );
    };
}
/**
 * Maps the {@see SpamFilterRules} a user has specified in they account to an array of filters
 */
function getUsersSpamFilters(
    provider: ethers.providers.BaseProvider,
    { spamFilterRules }: Account,
) {
    //User has not defined any rules
    if (!spamFilterRules) {
        return [];
    }

    return SUPPORTED_SPAM_FILTERS.filter(
        (f) => !!spamFilterRules[f.getId()],
    ).map((f) => f.getFilter(provider, spamFilterRules[f.getId()]));
}
/**
 * Tests if a envelope is spam based on its deliveryInformation. And the users preperences
 */
export async function isSpam(
    provider: ethers.providers.BaseProvider,
    account: Account,
    deliveryInformation: DeliveryInformation,
) {
    const usersSpamFilters = getUsersSpamFilters(provider, account);
    const filter = compileSpamFilter(usersSpamFilters);

    //The predicate of a filter returns true if the message is valid.
    const isValid = await filter(deliveryInformation);
    //Because the function returns wether a message isSpam we have to negate this value.
    return !isValid;
}
