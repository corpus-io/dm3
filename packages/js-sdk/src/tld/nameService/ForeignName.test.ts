import { ethers } from 'ethers';
import { ForeignName } from './ForeignName';

describe('ForeignName TLD resolver', () => {
    describe('isResolverForTldName', () => {
        it('returns true if ensName is a ForeignName', () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';
            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const foreignName = '0x1234.addr.foreign.eth';

            expect(
                foreignNameResolver.isResolverForTldName(foreignName),
            ).resolves.toBe(true);
        });
        it('returns false if ensName is within hte clients address namespace', () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';

            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const foreignName = '0x1234.addr.dm3.eth';

            expect(
                foreignNameResolver.isResolverForTldName(foreignName),
            ).resolves.toBe(false);
        });
    });
    describe('isResolverForAliasName', () => {
        it('returns true if ensName is a ForeignName', () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';
            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const dm3AddrName = '0x1234.addr.dm3.eth';
            const foreignName = '0x1234.addr.foreign.eth';

            expect(
                foreignNameResolver.isResolverForAliasName(
                    dm3AddrName,
                    foreignName,
                ),
            ).resolves.toBe(true);
        });
        it('returns false if ensName is within hte clients address namespace', () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';

            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const dm3AddrName = '0x1234.addr.dm3.eth';
            expect(
                foreignNameResolver.isResolverForAliasName(
                    dm3AddrName,
                    dm3AddrName,
                ),
            ).resolves.toBe(false);
        });
        it('returns false if foreignName is undefined', () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';

            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const dm3AddrName = '0x1234.addr.dm3.eth';
            expect(
                foreignNameResolver.isResolverForAliasName(dm3AddrName),
            ).resolves.toBe(false);
        });
    });
    describe('resolveAliasToTld', () => {
        it('returns foreignName', () => {
            const web3Provider = {} as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';
            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const dm3AddrName = '0x1234.addr.dm3.eth';
            const foreignName = '0x1234.addr.foreign.eth';

            expect(
                foreignNameResolver.resolveAliasToTLD(dm3AddrName, foreignName),
            ).resolves.toBe(foreignName);
        });
    });
    describe('resolveTLDtoAlias', () => {
        it('returns alias name from ens resolved addr', () => {
            const wallet = ethers.Wallet.createRandom();
            const web3Provider = {
                resolveName: jest.fn().mockResolvedValue(wallet.address),
            } as unknown as ethers.providers.JsonRpcProvider;

            const addressEnsSubdomain = '.addr.dm3.eth';
            const foreignNameResolver = new ForeignName(
                web3Provider,
                addressEnsSubdomain,
            );

            const foreignName = `${wallet.address}.addr.foreign.eth`;

            expect(
                foreignNameResolver.resolveTLDtoAlias(foreignName),
            ).resolves.toBe(`${wallet.address}.addr.dm3.eth`);
        });
    });
});
