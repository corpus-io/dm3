import { ethers } from 'ethers';
import { ITLDResolver } from './ITLDResolver';

const TOP_LEVEL_DOMAIN = '.op.dm3.eth';
const EVM_FETCHER_CONTRACT_ADDRESS =
    '0xa9369F43Ab09613cA32bC3b51201493bD24CED63';

function getIdForAddress(address: string, addrEnsSubdomain: string) {
    return address + addrEnsSubdomain;
}

export class OptimismNames implements ITLDResolver {
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly addrEnsSubdomain: string;

    constructor(
        provider: ethers.providers.JsonRpcProvider,
        addrEnsSubdomain: string,
    ) {
        this.provider = provider;
        this.addrEnsSubdomain = addrEnsSubdomain;
    }
    //e.g. max.op.dm3.eth => 0x1234.addr.dm3.eth
    async isResolverForTldName(ensName: string): Promise<boolean> {
        const isGnoDomain = ensName.endsWith(TOP_LEVEL_DOMAIN);

        if (!isGnoDomain) {
            return false;
        }
        return this.hasDm3ProfileOnEnsProfile(ensName);
    }
    //e.g. 0x1234.addr.dm3.eth => max.op.dm3.eth
    async isResolverForAliasName(ensName: string): Promise<boolean> {
        const address = ensName.split('.')[0];
        if (!ethers.utils.isAddress(address)) {
            return false;
        }
        //Use the reverse record to get the owner of the name
        const reverseNode = ethers.utils.namehash(
            `${address.slice(2).toLowerCase()}.addr.reverse`,
        );
        const name = await this.lookupAddressCcip(ensName, reverseNode);
        console.log('op name', name);

        return this.hasDm3ProfileOnEnsProfile(name);
    }
    //e.g. 0x1234.addr.dm3.eth => max.eth
    async resolveAliasToTLD(ensName: string): Promise<string> {
        const address = ensName.split('.')[0];
        if (!ethers.utils.isAddress(address)) {
            return ensName;
        }
        //Use the reverse record to get the owner of the name
        const reverseNode = ethers.utils.namehash(
            `${address.slice(2).toLowerCase()}.addr.reverse`,
        );
        const resolvedName = await this.lookupAddressCcip(ensName, reverseNode);
        return resolvedName ?? ensName;
    }
    //e.g. max.op.dm3eth => 0x1234.addr.dm3.eth
    async resolveTLDtoAlias(ensName: string): Promise<string> {
        const address = await this.resolveNameCcip(ensName);
        if (!address) {
            throw new Error('No address found for ' + ensName);
        }
        return getIdForAddress(
            ethers.utils.getAddress(address),
            this.addrEnsSubdomain,
        );
    }
    private async hasDm3ProfileOnEnsProfile(opName: string): Promise<boolean> {
        try {
            const aliasName = opName;
            const ensNameHasAddress = await this.resolveNameCcip(aliasName);

            const dm3Profile = await this.resolveTextCcip(
                aliasName,
                'network.dm3.profile',
            );

            if (!dm3Profile) {
                return false;
            }

            return !!ensNameHasAddress;
        } catch (err) {
            console.debug(
                `Cant resolve OP name ${opName} to address error: ${err}`,
            );
            return false;
        }
    }
    private getEvmFetcher() {
        return new ethers.utils.Interface([
            'function addr(bytes32) returns(address)',
            'function name(bytes32) returns(string)',
            'function text(bytes32 node, string calldata key) external view returns (string memory)',
            'function resolve(bytes,bytes) returns (bytes memory result)',
        ]);
    }
    //Helper function to retrieve the address of a given name from the Dm3NameRegistrar contract using the EVM FETCHER
    private async resolveNameCcip(opName: string) {
        try {
            const i = this.getEvmFetcher();
            const node = ethers.utils.namehash(opName);
            const innerReq = i.encodeFunctionData('addr', [node]);
            const outerReq = i.encodeFunctionData('resolve', [
                ethers.utils.dnsEncode(opName),
                innerReq,
            ]);

            const res = await this.provider.call({
                to: EVM_FETCHER_CONTRACT_ADDRESS,
                data: outerReq,
                ccipReadEnabled: true,
            });

            const decodedOuter = i.decodeFunctionResult('resolve', res);
            const decodedInner = i.decodeFunctionResult(
                'addr',
                decodedOuter[0],
            );

            const address = decodedInner[0];

            if (address === ethers.constants.AddressZero) {
                return null;
            }
            return address;
        } catch (err) {
            console.debug('Error resolving name op name ', err);
            return null;
        }
    }
    //Helper function to retrieve the name of a given address from the Dm3NameRegistrar contract using the EVM FETCHER
    //
    private async lookupAddressCcip(opName: string, reverseNode: string) {
        try {
            const i = this.getEvmFetcher();
            const innerReq = i.encodeFunctionData('name', [reverseNode]);
            const outerReq = i.encodeFunctionData('resolve', [
                ethers.utils.dnsEncode(opName),
                innerReq,
            ]);

            const res = await this.provider.call({
                to: EVM_FETCHER_CONTRACT_ADDRESS,
                data: outerReq,
                ccipReadEnabled: true,
            });

            const decodedOuter = i.decodeFunctionResult('resolve', res);
            const decodedInner = i.decodeFunctionResult(
                'name',
                decodedOuter[0],
            );
            return decodedInner[0];
        } catch (err) {
            console.debug('Error resolving name op name ', err);
            return null;
        }
    }
    //Helper function to retrieve a text record of a given name from the Dm3NameRegistrar contract using the EVM FETCHER

    private async resolveTextCcip(opName: string, key: string) {
        try {
            const i = this.getEvmFetcher();
            const node = ethers.utils.namehash(opName);
            const innerReq = i.encodeFunctionData('text', [node, key]);
            const outerReq = i.encodeFunctionData('resolve', [
                ethers.utils.dnsEncode(opName),
                innerReq,
            ]);

            const res = await this.provider.call({
                to: EVM_FETCHER_CONTRACT_ADDRESS,
                data: outerReq,
                ccipReadEnabled: true,
            });

            const decodedOuter = i.decodeFunctionResult('resolve', res);
            const decodedInner = i.decodeFunctionResult(
                'text',
                decodedOuter[0],
            );

            return decodedInner[0];
        } catch (err) {
            console.debug('Error resolving text for op name', err);
            return null;
        }
    }
}
