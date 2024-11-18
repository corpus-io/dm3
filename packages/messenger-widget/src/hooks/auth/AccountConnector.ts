/* eslint-disable max-len */
import { checkUserProfile, getUserProfile } from '@dm3-org/dm3-lib-profile';
import { log } from '@dm3-org/dm3-lib-shared';
import { createWeb3Name } from '@web3-name-sdk/core';
import { ethers } from 'ethers';
import { WalletClient } from 'viem';

export function getIdForAddress(address: string, addrEnsSubdomain: string) {
    return address + addrEnsSubdomain;
}

export const AccountConnector = (
    walletClient: WalletClient,
    mainnetProvider: ethers.providers.JsonRpcProvider,
    addrEnsSubdomain: string,
) => {
    async function connectOffchainAccount(address: string) {
        try {
            /**
             * We've to check if the use already has a profile on the delivery service
             * if so we can use that account
             * Otherwise we use the addr_ens_subdomain
             */
            const ensName = getIdForAddress(address, addrEnsSubdomain);

            //We're trying to get the profile from the delivery service
            const userProfile = await getUserProfile(mainnetProvider, ensName);

            return { ensName, userProfile };
        } catch (e) {
            log(`Profile not found ` + e, 'error');
            return undefined;
        }
    }
    async function connectOnchainAccount(ensName: string, address: string) {
        let onChainProfile;
        let offChainProfile;

        const offchainAddrAlias = getIdForAddress(address, addrEnsSubdomain);
        try {
            onChainProfile = await getUserProfile(mainnetProvider!, ensName);
            offChainProfile = await getUserProfile(
                mainnetProvider!,
                offchainAddrAlias,
            );
        } catch (error) {
            log(
                'Cant load profile from chain' + JSON.stringify(error),
                'error',
            );
            onChainProfile = undefined;
        }
        //There might be cases where the onchain profile is not the same as the offchain profile
        //We find a solution on how we would migrate messages then
        const profilesAreEqual =
            JSON.stringify(onChainProfile) === JSON.stringify(offChainProfile);

        if (!profilesAreEqual) {
            console.log('OnChain Profile is not the same as offchain profile');
        }

        /**
         * If it turns out there is no on chain profile available
         * we proceed trying to connect the account with an offchain profile
         */
        if (!onChainProfile) {
            return await connectOffchainAccount(address);
        }

        return {
            userProfile: onChainProfile,
            ensName: offchainAddrAlias,
        };
    }

    //Add support for other chains when the refactoring is finished and we do more integrations
    async function getOnChainEnsName(address: string) {
        //@ts-ignore
        const chainId = await walletClient.getChainId();
        // either chidaodo or xdai
        if (chainId === 10200 || chainId === 100) {
            const web3Name = createWeb3Name();

            const spaceIdWeb3Name = await web3Name.getDomainName({
                address,
                queryChainIdList: [chainId],
            });
            //User is connected with an address that has no genome name yet
            if (!spaceIdWeb3Name) {
                return undefined;
            }

            console.log(
                `resolved genome name ${spaceIdWeb3Name} for ${address}`,
            );

            //hardcode genome name and move to LIB fn (Alex)
            const resolvedTLD = 'gnosis.eth';
            const l1EnsName = spaceIdWeb3Name.replace(
                '.gno',
                '.' + resolvedTLD,
            );
            return l1EnsName;
        }

        return await mainnetProvider.lookupAddress(address);
    }

    const connect = async (address: string) => {
        try {
            const onChainEnsName = await getOnChainEnsName(address);

            console.log('connect with onchain name', onChainEnsName);
            return onChainEnsName
                ? await connectOnchainAccount(onChainEnsName, address)
                : await connectOffchainAccount(address);
        } catch (e) {
            console.log(e);
        }
    };
    return {
        connect,
    };
};
