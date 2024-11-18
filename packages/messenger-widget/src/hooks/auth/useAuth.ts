import {
    createStorageKey,
    getStorageKeyCreationMessage,
} from '@dm3-org/dm3-lib-crypto';
import {
    Account,
    ProfileKeys,
    SignedUserProfile,
    UserProfile,
    createProfileKeys as _createProfileKeys,
    getProfileCreationMessage,
    getUserProfile,
    normalizeEnsName,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { sha256, toUtf8Bytes } from 'ethers/lib/utils';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { closeLoader, startLoader } from '../../components/Loader/Loader';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { ModalContext } from '../../context/ModalContext';
import { TLDContext } from '../../context/TLDContext';
import { UiViewContext } from '../../context/UiViewContext';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';
import { SignMessageFn } from '../server-side/ServerSideConnector';
import { AccountConnector, getIdForAddress } from './AccountConnector';
import { LuksoConnector } from './lukso/LuksoConnector';

export const useAuth = () => {
    const mainnetProvider = useMainnetProvider();

    const { resolveAliasToTLD } = useContext(TLDContext);
    const { data: walletClient } = useWalletClient();
    const { dm3Configuration } = useContext(DM3ConfigurationContext);
    const { resetViewStates } = useContext(UiViewContext);
    const { resetModalStates } = useContext(ModalContext);

    const { address } = useAccount({
        onDisconnect: () => signOut(),
    });

    const [account, setAccount] = useState<Account | undefined>(undefined);

    const [ethAddress, setEthAddress] = useState<string | undefined>(undefined);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    //The account name that should be displayed to the user. Takes alias profiles and Crosschain names into account
    const [displayName, setDisplayName] = useState<string | undefined>(
        undefined,
    );
    const [profileKeys, setProfileKeys] = useState<ProfileKeys | undefined>();

    //Effect to resolve the display name of the account currently logged in.
    //The main purpose of that function is check wether the account has been minted via an L2 name service such as
    //genome and therefore has a crosschain name that is resolved with the TopLevelAliasResolver
    useEffect(() => {
        const fetchDisplayName = async () => {
            if (!account) {
                return;
            }
            const displayName = await resolveAliasToTLD(account?.ensName);
            console.log('updated account', account);
            setDisplayName(displayName);
        };
        fetchDisplayName();
    }, [ethAddress, account]);

    const isProfileReady = useMemo<boolean>(
        () => !!account && !!profileKeys,
        [account, profileKeys],
    );

    // handles account change
    useEffect(() => {
        if (address && ethAddress && ethAddress !== address) {
            signOut();
        }
    }, [address]);

    const signOut = () => {
        setAccount(undefined);
        resetStates();
    };
    //The normal sign in function that is used when the user signs in with their own account, using a web3 provider like wallet connect or metamask
    const cleanSignIn = async () => {
        setIsLoading(true);
        setHasError(false);
        //Fetch the Account either from onchain or via CCIP
        const account = await AccountConnector(
            walletClient!,
            mainnetProvider,
            dm3Configuration.addressEnsSubdomain,
        ).connect(address!);

        if (!account) {
            throw Error('error fetching dm3Account');
        }

        await _login(
            account.ensName,
            address!,
            account.userProfile,
            (message: string) => walletClient!.signMessage({ message }),
        );
    };

    //Siwe signin is used when a siwe message has been provided by an app using dm3 as a widget.
    //The user is signed in with a random account based on the provided secret
    const siweSignIn = async () => {
        startLoader();
        //First we have to create a wallet based on the provided siwe secret
        const secret = dm3Configuration.siwe?.secret;
        if (!secret) {
            closeLoader();
            throw Error('No SIWE secret provided');
        }
        const carrierWallet = new ethers.Wallet(sha256(toUtf8Bytes(secret)));

        //Check if the account has been used already
        const ensName = getIdForAddress(
            carrierWallet.address,
            dm3Configuration.addressEnsSubdomain,
        );
        const userProfile = await getUserProfile(mainnetProvider, ensName);

        await _login(
            ensName,
            carrierWallet.address!,
            userProfile,
            (msg: string) => carrierWallet.signMessage(msg),
        );
        closeLoader();
    };

    const luksoSignIn = async () => {
        const lc = await LuksoConnector._instance(dm3Configuration);
        const res = await lc.login();

        if (res.type === 'SUCCESS') {
            const { profile, profileKeys, controllerAddress, accountAddress } =
                res;

            const ensName = getIdForAddress(
                accountAddress,
                dm3Configuration.addressEnsSubdomain,
            );
            _setAccount(ensName, accountAddress, profile, profileKeys);
            return;
        }

        throw Error('Login failed UNIMPLEMENTED!');
    };
    const _login = async (
        ensName: string,
        address: string,
        _signedUserProfile: SignedUserProfile | undefined,
        signMessage: SignMessageFn,
    ) => {
        async function createProfileKeys(
            nonce: string = dm3Configuration.nonce,
        ): Promise<ProfileKeys> {
            if (!address) {
                throw Error('No eth address');
            }

            const storageKeyCreationMessage = getStorageKeyCreationMessage(
                nonce,
                address,
            );

            const signature = await signMessage(storageKeyCreationMessage);
            const storageKey = await createStorageKey(signature);
            return await _createProfileKeys(storageKey, nonce);
        }
        const createNewSignedUserProfile = async ({
            signingKeyPair,
            encryptionKeyPair,
        }: ProfileKeys) => {
            const profile: UserProfile = {
                publicSigningKey: signingKeyPair.publicKey,
                publicEncryptionKey: encryptionKeyPair.publicKey,
                deliveryServices: [dm3Configuration.defaultDeliveryService],
            };
            try {
                const profileCreationMessage = getProfileCreationMessage(
                    stringify(profile),
                    address,
                );
                const signature = await signMessage(profileCreationMessage);

                return {
                    profile,
                    signature,
                } as SignedUserProfile;
            } catch (error: any) {
                const err = error?.message.split(':');
                throw Error(err.length > 1 ? err[1] : err[0]);
            }
        };

        console.log('start login ');
        //At first we create the profileKeys thoose keys are generated either via the users wallet or via the SIWE secret
        //The profileKeys are used to sign the profile that will be created at the delivery service
        const keys = await createProfileKeys();
        //If user profile is still undefined we have to create a new profile

        const signedUserProfile =
            _signedUserProfile ?? (await createNewSignedUserProfile(keys));

        //Update the state with the new account
        _setAccount(ensName, address, signedUserProfile, keys);
    };

    const _setAccount = (
        ensName: string,
        address: string,
        signedUserProfile: SignedUserProfile,
        profileKeys: ProfileKeys,
    ) => {
        setAccount({
            ...account,
            ensName: normalizeEnsName(ensName),
            profile: signedUserProfile.profile,
            profileSignature: signedUserProfile.signature,
        });

        setEthAddress(address);
        setIsLoading(false);
        setProfileKeys(profileKeys);
    };

    const resetStates = () => {
        resetViewStates();
        resetModalStates();
    };

    return {
        profileKeys,
        cleanSignIn,
        luksoSignIn,
        siweSignIn,
        setDisplayName,
        account,
        displayName,
        ethAddress,
        isProfileReady,
        isLoading,
        hasError,
        setAccount,
    };
};
