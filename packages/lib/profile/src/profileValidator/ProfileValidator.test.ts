import {
    formatAddress,
    getProfileCreationMessage,
    SignedUserProfile,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import {
    MockedUserProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { expect } from 'chai';
import { ethers } from 'ethers';
import { ProfileValidator } from './ProfileValidator';

describe('ProfileValidator', () => {
    let alice: MockedUserProfile;
    let upAddress: MockedUserProfile;
    let upController: MockedUserProfile;
    let rando: MockedUserProfile;
    beforeEach(async () => {
        alice = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'alice.eth',
            ['http://localhost:3000'],
        );
        upAddress = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'upAddress.eth',
            ['http://localhost:3000'],
        );
        upController = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'upController.eth',
            ['http://localhost:3000'],
        );
        rando = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'rando.eth',
            ['http://localhost:3000'],
        );
    });
    describe('isDm3AddressProfile', () => {
        it('should return true if the profile is valid', async () => {
            const provider = {} as ethers.providers.Web3Provider;

            const isValidProfile = await new ProfileValidator(
                provider,
            ).validate(alice.signedUserProfile, alice.address);
            expect(isValidProfile).to.equal(true);
        });

        it('should return false if the signature does not match the address', async () => {
            const provider = {
                _isProvider: true,
                call: async (tx: any) => {
                    return '0x';
                },
            } as unknown as ethers.providers.Web3Provider;
            const isValidProfile = await new ProfileValidator(
                provider,
            ).validate(alice.signedUserProfile, rando.address);
            expect(isValidProfile).to.equal(false);
        });
    });
    describe('isLuksosProfile', () => {
        it('should return true if the profile signature corresponds to a controller address ', async () => {
            const provider = {
                _isProvider: true,
                call: async (tx: any) => {
                    const abi = [
                        'function isValidSignature(bytes32 _hash, bytes _signature) view returns (bytes4)',
                    ];
                    const iface = new ethers.utils.Interface(abi);

                    const [hash, signature] = iface.decodeFunctionData(
                        'isValidSignature',
                        tx.data,
                    );

                    const isValid =
                        ethers.utils.recoverAddress(hash, signature) ===
                        //The controller has signed the profile of the UP address
                        formatAddress(upController.address);

                    //If successful, return the ERC1271 success value
                    //If not, return the ERC1271 failure value
                    return iface.encodeFunctionResult('isValidSignature', [
                        isValid ? '0x1626ba7e' : '0xffffffff',
                    ]);
                },
            } as unknown as ethers.providers.Web3Provider;

            //The controller sines the userProfile of the UP address
            const upProfilesignedByController: SignedUserProfile = {
                ...upAddress.signedUserProfile,
                signature: await upController.wallet.signMessage(
                    getProfileCreationMessage(
                        stringify(upAddress.signedUserProfile.profile),
                        //address has to be the UP address
                        upAddress.address,
                    ),
                ),
            };

            const isValidProfile = await new ProfileValidator(
                provider,
            ).validate(upProfilesignedByController, upAddress.address);
            expect(isValidProfile).to.equal(true);
        });
        it('should return false if isValidSignature returns false', async () => {
            const provider = {
                _isProvider: true,
                call: async (tx: any) => {
                    const abi = [
                        'function isValidSignature(bytes32 _hash, bytes _signature) view returns (bytes4)',
                    ];
                    const iface = new ethers.utils.Interface(abi);

                    //The contract decided that the signature is valid. And returns the ERC
                    return iface.encodeFunctionResult('isValidSignature', [
                        '0xffffffff',
                    ]);
                },
            } as unknown as ethers.providers.Web3Provider;
            const isValidProfile = await new ProfileValidator(
                provider,
            ).validate(upAddress.signedUserProfile, rando.address);
            expect(isValidProfile).to.equal(false);
        });
        it('should return false if the contract call failed', async () => {
            const provider = {
                _isProvider: true,
                call: async (tx: any) => {
                    return '0x';
                },
            } as unknown as ethers.providers.Web3Provider;
            const isValidProfile = await new ProfileValidator(
                provider,
            ).validate(upAddress.signedUserProfile, rando.address);
            expect(isValidProfile).to.equal(false);
        });
    });
});
