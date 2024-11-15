import { Account } from '@dm3-org/dm3-lib-profile';
import { Dm3Name } from '../hooks/topLevelAlias/nameService/Dm3Name';
import { ethers } from 'ethers';
import { DM3Configuration } from '../interfaces/config';
import { OptimismNames } from '../hooks/topLevelAlias/nameService/OptimismNames';
import { Genome } from '../hooks/topLevelAlias/nameService/Genome';
import { EthereumNameService } from '../hooks/topLevelAlias/nameService/EthereumNameService';

export const fetchExistingDM3Name = async (
    account: Account,
    mainnetProvider: ethers.providers.JsonRpcProvider,
    dm3Configuration: DM3Configuration,
    addressName: string,
) => {
    try {
        if (account) {
            const dm3NameService = new Dm3Name(
                mainnetProvider,
                dm3Configuration.addressEnsSubdomain,
                dm3Configuration.userEnsSubdomain,
                dm3Configuration.resolverBackendUrl,
            );
            const dm3Name = await dm3NameService.resolveAliasToTLD(addressName);
            // Not a DM3 name -> 0xa966.beta-addr.dm3.eth
            // Its DM3 name -> bob.beta-user.dm3.eth
            // Checks user sub domain for setting DM3 name
            return dm3Name.endsWith(dm3Configuration.userEnsSubdomain)
                ? dm3Name
                : null;
        }
        return null;
    } catch (error) {
        console.log('dm3 name : ', error);
        return null;
    }
};

export const fetchExistingOpName = async (
    account: Account,
    mainnetProvider: ethers.providers.JsonRpcProvider,
    dm3Configuration: DM3Configuration,
    addressName: string,
) => {
    try {
        if (account) {
            const opNameService = new OptimismNames(
                mainnetProvider,
                dm3Configuration.addressEnsSubdomain,
            );
            const opName = await opNameService.resolveAliasToTLD(addressName);
            return opName.endsWith('.op.dm3.eth') ? opName : null;
        }
        return null;
    } catch (error) {
        console.log('OP name : ', error);
        return null;
    }
};

export const fetchExistingGnosisName = async (
    account: Account,
    mainnetProvider: ethers.providers.JsonRpcProvider,
    dm3Configuration: DM3Configuration,
    addressName: string,
) => {
    try {
        if (account) {
            const gnosisNameService = new Genome(
                mainnetProvider,
                dm3Configuration.addressEnsSubdomain,
            );
            const gnosisName = await gnosisNameService.resolveAliasToTLD(
                addressName,
            );
            return gnosisName.endsWith('.gnosis.eth') ||
                gnosisName.endsWith('.gno')
                ? gnosisName
                : null;
        }
        return null;
    } catch (error) {
        console.log('Gnosis name : ', error);
        return null;
    }
};

export const fetchExistingEnsName = async (
    account: Account,
    mainnetProvider: ethers.providers.JsonRpcProvider,
    dm3Configuration: DM3Configuration,
    addressName: string,
) => {
    try {
        if (account) {
            const ensNameService = new EthereumNameService(
                mainnetProvider,
                dm3Configuration.addressEnsSubdomain,
                dm3Configuration.userEnsSubdomain,
            );
            const ensName = await ensNameService.resolveAliasToTLD(addressName);
            // .dm3.eth means it is not ENS name
            return ensName.endsWith('.dm3.eth') ? null : ensName;
        }
        return null;
    } catch (error) {
        console.log('ENS name : ', error);
        return null;
    }
};
