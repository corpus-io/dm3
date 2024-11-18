import { ethers } from 'ethers';
import {
    getProfileCreationMessage,
    UserProfile,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import { Account } from './Account';
import { getUserProfile, submitUserProfile } from './UserProfile';

const SENDER_NAME = 'alice.eth';
const RANDO_NAME = 'bob.eth';
const SENDER_ADDRESS = '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1';
const RANDO_ADDRESS = '0xDd36ae7F9a8E34FACf1e110c6e9d37D0dc917855';

const emptyProfile: UserProfile = {
    publicSigningKey: '',
    publicEncryptionKey: '',
    deliveryServices: [''],
};

const signProfile = async (profile: UserProfile) => {
    //0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1
    const mnemonic =
        'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol';

    const wallet = ethers.Wallet.fromMnemonic(mnemonic);

    const profileCreationMessage = getProfileCreationMessage(
        stringify(profile),
        '0x71cb05ee1b1f506ff321da3dac38f25c0c9ce6e1',
    );

    const signature = await wallet.signMessage(profileCreationMessage);

    const signedUserProfile = {
        profile,
        signature,
    };
    return await signedUserProfile;
};

describe('UserProfile', () => {
    describe('SubmitUserProfile', () => {
        it('rejects a userProfile with a wrong signature', async () => {
            const setAccount = jest.fn();
            const getAccount = () => Promise.resolve(null);

            const singedUserProfile = await signProfile(emptyProfile);
            const luksoProvider = {
                _isProvider: true,
            } as ethers.providers.BaseProvider;

            await expect(async () => {
                await submitUserProfile(
                    luksoProvider,
                    getAccount,
                    setAccount,
                    RANDO_ADDRESS,
                    singedUserProfile,
                    'my-secret',
                );
            }).rejects.toEqual(
                Error('submit user profile failed - invalid profile'),
            );
            expect(setAccount).not.toBeCalled();
        });

        it('override a userProfile that already exists but with other nonce', async () => {
            const setAccount = () => Promise.resolve();
            const getAccount = async (address: string) => {
                const account = async (
                    account: string,
                    token: string,
                    profile: UserProfile,
                ): Promise<Account> => {
                    const signedUserProfile = await signProfile(profile);
                    return {
                        account,
                        signedUserProfile,
                        token,
                        createdAt: new Date().getTime(),
                        profileExtension: {
                            encryptionAlgorithm: [],
                            notSupportedMessageTypes: [],
                        },
                    };
                };

                return account(SENDER_ADDRESS, '123', emptyProfile);
            };

            const singedUserProfile = await signProfile(emptyProfile);

            const luksoProvider = {} as ethers.providers.BaseProvider;

            await submitUserProfile(
                luksoProvider,
                getAccount,
                setAccount,
                SENDER_ADDRESS,
                singedUserProfile,
                'my-secret',
            );

            await expect(async () => {
                await submitUserProfile(
                    luksoProvider,
                    getAccount,
                    setAccount,
                    SENDER_ADDRESS,
                    singedUserProfile,
                    'my-new-secret',
                );
            }).resolves;
        });

        it('stores a newly created user profile', async () => {
            const setAccount = jest.fn();
            const getAccount = () => Promise.resolve(null);

            const singedUserProfile = await signProfile(emptyProfile);

            const luksoProvider = {} as ethers.providers.BaseProvider;

            await submitUserProfile(
                luksoProvider,
                getAccount,
                setAccount,
                SENDER_ADDRESS,
                singedUserProfile,
                'my-secret',
            );

            expect(setAccount).toBeCalled();
        });
    });
    describe('GetUserProfile', () => {
        it('Returns undefined if address has no account', async () => {
            const getAccount = () => Promise.resolve(null);

            const profile = await getUserProfile(getAccount, RANDO_NAME);

            expect(profile).toBeUndefined();
        });
        it('Returns the signedUserProfile if a account was created', async () => {
            const getAccount = () =>
                Promise.resolve({ signedUserProfile: {} } as Account);

            const profile = await getUserProfile(getAccount, RANDO_NAME);

            expect(profile).not.toBeUndefined();
        });
    });
});
