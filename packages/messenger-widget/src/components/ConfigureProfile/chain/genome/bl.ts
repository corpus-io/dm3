import { Account, SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import { ethersHelper, stringify } from '@dm3-org/dm3-lib-shared';
import { getConractInstance } from '@dm3-org/dm3-lib-shared/dist/ethersHelper';
import { ethers } from 'ethers';
import { closeLoader, startLoader } from '../../../Loader/Loader';
import { Address, namehash, toHex } from 'viem';
import { NAME_TYPE } from '../common';
import { createWeb3Name } from '@web3-name-sdk/core';

//Space id uses the namehash of the name + the GNO identifier to calculate the node
const GNO_IDENTIFIER = BigInt(
    '2702484275810670337286593638197304166435784191035983069259851825108946',
);

export function getSpaceIdNode(inputName: string): Address {
    const fullNameNode = `${inputName}.[${toHex(GNO_IDENTIFIER, {
        size: 32,
    }).slice(2)}]`;
    return namehash(fullNameNode);
}

export const isGenomeNameValid = async (
    provider: ethers.providers.StaticJsonRpcProvider,
    ensName: string,
    ethAddress: string,
    setError: (type: NAME_TYPE | undefined, msg: string) => void,
) => {
    const isValidEnsName = ethers.utils.isValidName(ensName);
    if (!isValidEnsName) {
        setError(NAME_TYPE.ENS_NAME, 'Invalid GNO name');
        return false;
    }
    const isGenomeName = validateGenomeName(ensName);
    if (!isGenomeName) {
        setError(NAME_TYPE.ENS_NAME, 'Genome name has to end with ');
        return false;
    }
    const web3Name = createWeb3Name();
    const owner = await web3Name.getAddress(ensName);

    if (owner === null) {
        setError(NAME_TYPE.ENS_NAME, 'owner not found');
        return false;
    }
    if (
        owner &&
        ethersHelper.formatAddress(owner) !==
            ethersHelper.formatAddress(ethAddress!)
    ) {
        setError(
            NAME_TYPE.ENS_NAME,
            'You are not the owner/manager of this name',
        );
        return false;
    }

    return true;
};

const getPublishProfileOnchainTransaction = async (
    provider: ethers.providers.StaticJsonRpcProvider,
    account: Account,
    ensName: string,
) => {
    if (!account.profile) {
        throw Error('No profile');
    }
    if (!account.profileSignature) {
        throw Error('No signature');
    }

    const genomeResolver = '0x6D3B3F99177FB2A5de7F9E928a9BD807bF7b5BAD';

    const resolver = ethersHelper.getConractInstance(
        genomeResolver,
        [
            'function setText(bytes32 node, string calldata key, string calldata value) external',
        ],
        provider,
    );

    const signedUserProfile: SignedUserProfile = {
        profile: account.profile,
        signature: account.profileSignature,
    };

    const node = getSpaceIdNode(ensName);

    const jsonPrefix = 'data:application/json,';
    const key = 'network.dm3.profile';
    const value = jsonPrefix + stringify(signedUserProfile);

    return {
        method: resolver.setText,
        args: [node, key, value],
    };
};

export const submitGenomeNameTransaction = async (
    provider: ethers.providers.StaticJsonRpcProvider,
    account: Account,
    setLoaderContent: (content: string) => void,
    ensName: string,
    ethAddress: string,
    setEnsNameFromResolver: Function,
    setError: (type: NAME_TYPE | undefined, msg: string) => void,
) => {
    try {
        // start loader
        setLoaderContent('Publishing profile...');
        startLoader();

        const isValid = await isGenomeNameValid(
            provider,
            ensName,
            ethAddress,
            setError,
        );

        if (!isValid) {
            closeLoader();
            return;
        }

        const tx = await getPublishProfileOnchainTransaction(
            provider,
            account,
            ensName!,
        );

        if (tx) {
            const response = await ethersHelper.executeTransaction(tx);
            await response.wait();
            setEnsNameFromResolver(ensName);
            // stop loader
            closeLoader();
            return true;
        } else {
            // stop loader
            closeLoader();
            throw Error('Error creating publish transaction');
        }
    } catch (e: any) {
        const check = e.toString().includes('user rejected transaction');
        setError(
            NAME_TYPE.ENS_NAME,
            check
                ? 'User rejected transaction'
                : 'You are not the owner/manager of this name',
        );
        // stop loader
        closeLoader();
        return false;
    }
};

export const validateGenomeName = (ensName: string) => {
    return ensName.endsWith('.gno');
};
