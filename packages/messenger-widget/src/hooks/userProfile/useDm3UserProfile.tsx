import { useMemo, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { isValidName } from 'ethers/lib/utils';
import { updateProfile } from './../../adapters/offchainResolverApi';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { ethers } from 'ethers';
import {
    Account,
    getProfileCreationMessage,
    getUserProfile,
    SignedUserProfile,
    UserProfile,
} from '@dm3-org/dm3-lib-profile';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';
import {
    fetchExistingDM3Name,
    fetchExistingEnsName,
    fetchExistingGnosisName,
    fetchExistingOpName,
} from '../../utils/names';
import { publishProfile } from '../../components/ConfigureProfile/dm3Names/optimismName/tx/publishProfile';
import { registerOpName } from '../../components/ConfigureProfile/dm3Names/optimismName/tx/registerOpName';
import { ModalContext } from '../../context/ModalContext';
import { closeLoader, startLoader } from '../../components/Loader/Loader';
import { submitGenomeNameTransaction } from '../../components/ConfigureProfile/chain/genome/bl';
import { submitEnsNameTransaction } from '../../components/ConfigureProfile/chain/ens/bl';
import { useChainId, useSwitchNetwork, useWalletClient } from 'wagmi';
import { stringify } from '@dm3-org/dm3-lib-shared';
import {
    DM3_NAME_SERVICES,
    fetchChainIdFromDM3ServiceName,
    fetchChainIdFromServiceName,
    NAME_SERVICES,
} from '../../components/ConfigureProfile/bl';
import profPicture from '../../assets/images/human.svg';

export interface INodeDetails {
    dsNames: string[];
}

export interface INameProfile {
    addrName: {
        profile: null | UserProfile;
        isActive: boolean;
    } | null;
    dm3Name: {
        profile: null | UserProfile;
        isActive: boolean;
    } | null;
    opName: {
        profile: null | UserProfile;
        isActive: boolean;
    } | null;
    gnosisName: {
        profile: null | UserProfile;
        isActive: boolean;
    } | null;
    ensName: {
        profile: null | UserProfile;
        isActive: boolean;
    } | null;
}

export const useDm3UserProfile = () => {
    const connectedChainId = useChainId();

    const { switchNetwork } = useSwitchNetwork({
        onSuccess: async () => {
            await executeTransaction();
        },
    });

    const { data: walletClient } = useWalletClient();

    const mainnetProvider = useMainnetProvider();

    const { account, ethAddress } = useContext(AuthContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { setLoaderContent } = useContext(ModalContext);

    const [nodes, setNodes] = useState<INodeDetails>({
        dsNames: account?.profile?.deliveryServices as string[],
    });

    const [isModalOpenToAddNode, setIsModalOpenToAddNode] =
        useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);

    const [nodeName, setNodeName] = useState<string>('');

    const [profileName, setProfileName] = useState<string | null>(null);

    const [namesWithProfile, setNamesWithProfile] = useState<INameProfile>({
        addrName: null,
        dm3Name: null,
        opName: null,
        gnosisName: null,
        ensName: null,
    });

    const [accountProfilePicture, setAccountProfilePicture] =
        useState<string>(profPicture);

    // adds DS nodes in local storage of browser
    const setDsNodesInLocalStorage = (data: INodeDetails) => {
        // fetch data from local storage
        const dsLocalData = localStorage.getItem('ds_nodes');
        let parsedData;
        if (dsLocalData) {
            // update or add the DS node data of connected account to local storage
            parsedData = JSON.parse(dsLocalData);
            parsedData[ethAddress as string] = data;
        }
        // if local storage doesn't have data then add fresh data
        const freshData = { [ethAddress as string]: data };
        localStorage.setItem(
            'ds_nodes',
            JSON.stringify(parsedData ?? freshData),
        );
    };

    // retrieves DS nodes from local storage of browser
    const getDsNodesFromLocalStorage = (): INodeDetails => {
        const data = localStorage.getItem('ds_nodes');
        // checks if local storage has data or not
        const parsedData = data ? JSON.parse(data) : null;
        // return the data only if connected account's data found
        return parsedData
            ? parsedData[ethAddress as string]
                ? parsedData[ethAddress as string]
                : null
            : null;
    };

    // fetches profile for the names like ADDR, DM3, OP, GNO and ENS
    const fetchUserProfileForAllNames = async (dsNodes: INodeDetails) => {
        if (ethAddress && dsNodes) {
            // fetch ADDR name, DM3 name, OP name, GNO name & ENS name
            const addressName = ethAddress.concat(
                dm3Configuration.addressEnsSubdomain,
            );

            const dm3Name = await fetchExistingDM3Name(
                account as Account,
                mainnetProvider,
                dm3Configuration,
                addressName,
            );

            const opName = await fetchExistingOpName(
                account as Account,
                mainnetProvider,
                dm3Configuration,
                addressName,
            );

            const ensName = await fetchExistingEnsName(
                account as Account,
                mainnetProvider,
                dm3Configuration,
                addressName,
            );

            const gnosisName = await fetchExistingGnosisName(
                account as Account,
                mainnetProvider,
                dm3Configuration,
                addressName,
            );

            // fetch user profiles for ADDR name, DM3 name, OP name, GNO name & ENS name
            const addressNameProfile = await getUserProfile(
                mainnetProvider,
                addressName,
            ).catch((e) => null);

            const dm3NameProfile = dm3Name
                ? await getUserProfile(mainnetProvider, dm3Name).catch(
                      (e) => null,
                  )
                : null;

            const opNameProfile = opName
                ? await getUserProfile(mainnetProvider, opName).catch(
                      (e) => null,
                  )
                : null;

            const ensNameProfile = ensName
                ? await getUserProfile(mainnetProvider, ensName).catch(
                      (e) => null,
                  )
                : null;

            const gnosisNameProfile = gnosisName
                ? await getUserProfile(mainnetProvider, gnosisName).catch(
                      (e) => null,
                  )
                : null;

            // update states to store the profle for each name
            setNamesWithProfile({
                addrName: {
                    profile: addressNameProfile?.profile ?? null,
                    isActive: !!addressNameProfile?.profile,
                },
                dm3Name: {
                    profile: dm3NameProfile?.profile ?? null,
                    isActive: !!dm3NameProfile?.profile,
                },
                opName: {
                    profile: opNameProfile?.profile ?? null,
                    isActive: !!opNameProfile?.profile,
                },
                ensName: {
                    profile: ensNameProfile?.profile ?? null,
                    isActive: !!ensNameProfile?.profile,
                },
                gnosisName: {
                    profile: gnosisNameProfile?.profile ?? null,
                    isActive: !!gnosisNameProfile?.profile,
                },
            });
        }
    };

    // Initializes user delivery services to show on Network screen
    const initialize = async () => {
        if (account?.profile) {
            // fetch DS nodes from profile
            const profileData = account.profile;
            const dsNodesFromProfile: INodeDetails = {
                dsNames: profileData.deliveryServices,
            };

            // fetch DS nodes from local storage
            const dsNodeFromLocalStorage = getDsNodesFromLocalStorage();

            // filter out duplicate nodes
            const profileDsNodes: INodeDetails = dsNodeFromLocalStorage
                ? dsNodeFromLocalStorage
                : dsNodesFromProfile;

            if (!dsNodeFromLocalStorage) {
                setDsNodesInLocalStorage(profileDsNodes);
            }

            // fetches all profiles of a account
            await fetchUserProfileForAllNames(profileDsNodes);

            // set nodes in the list to show on Network UI
            setNodes(profileDsNodes);
            return;
        }
    };

    const updateProfileForAddressName = async () => {
        // add those nodes to new profile
        const newProfile = { ...account?.profile! };
        newProfile.deliveryServices = nodes.dsNames;

        // fetch subdomain for ADDR name
        const subdomain = dm3Configuration.addressEnsSubdomain.substring(1);

        // fetch profile creation message to update the profile
        const profileCreationMessage = getProfileCreationMessage(
            stringify(newProfile),
            ethAddress as string,
        );

        // sign the message to update the profile
        const signature = await walletClient
            ?.signMessage({
                message: profileCreationMessage,
            })
            .catch((err) => {
                console.log('signature error: ', err);
                return;
            });

        // create new profile object
        const signedUserProfile = {
            profile: newProfile,
            signature: signature,
        } as SignedUserProfile;

        // update profile
        const success = await updateProfile(
            ethAddress as string,
            dm3Configuration.resolverBackendUrl,
            subdomain,
            signedUserProfile,
        );

        // update the profile state of ADDR name & DM3 name as both have same profile
        if (success) {
            setNamesWithProfile((prev) => {
                return {
                    ...prev,
                    addrName: { profile: newProfile, isActive: true },
                    dm3Name: prev.dm3Name
                        ? { profile: newProfile, isActive: true }
                        : prev.dm3Name,
                };
            });
        }
    };

    /**
     * Changes network to update the profile on particular blockchain
     */
    const updateProfileWithTransaction = async (
        existingName: string | null,
    ) => {
        // extract array of delivery service nodes names
        const newNodes = nodes.dsNames.map((n) => n);

        // add those nodes to new profile
        const newProfile: UserProfile = { ...account?.profile! };
        newProfile.deliveryServices = newNodes;

        // update account with new profile
        const updatedAccount: Account = { ...account } as Account;
        updatedAccount.profile = newProfile;

        // if no name found, don't update
        if (!existingName) {
            return;
        }

        setProfileName(existingName);

        // check its OPTIMISM name
        if (existingName.endsWith('.op.dm3.eth')) {
            const chainId = fetchChainIdFromDM3ServiceName(
                DM3_NAME_SERVICES.OPTIMISM,
                dm3Configuration.chainId,
            );

            chainId !== connectedChainId
                ? changeNetwork(chainId)
                : executeTransaction(existingName);
        }

        // check its GNOSIS name
        if (
            existingName?.endsWith('.gno') ||
            existingName?.endsWith('.gnosis.eth')
        ) {
            const chainId = fetchChainIdFromServiceName(
                NAME_SERVICES.GENOME,
                dm3Configuration.chainId,
            );

            chainId !== connectedChainId
                ? changeNetwork(chainId)
                : executeTransaction(existingName);
        }

        // check its ENS name
        if (existingName?.endsWith('.eth')) {
            const chainId = fetchChainIdFromServiceName(
                NAME_SERVICES.ENS,
                dm3Configuration.chainId,
            );
            chainId !== connectedChainId
                ? changeNetwork(chainId)
                : executeTransaction(existingName);
        }
    };

    /**
     * Executes blockchain transaction to update profile on OP, GNO and ENS name
     */
    const executeTransaction = async (name?: string) => {
        const profileNameToUpdate = name ? name : profileName;

        // extract array of delivery service nodes names
        const newNodes = nodes.dsNames.map((n) => n);

        // add those nodes to new profile
        const newProfile: UserProfile = { ...account?.profile! };
        newProfile.deliveryServices = newNodes;

        const provider = new ethers.providers.Web3Provider(
            window.ethereum as ethers.providers.ExternalProvider,
        );

        // if no name found, don't update
        if (!profileNameToUpdate) {
            return;
        }

        // fetch profile creation message to update the profile
        const profileCreationMessage = getProfileCreationMessage(
            stringify(newProfile),
            ethAddress as string,
        );

        // sign the message to update the profile
        const signature = await walletClient
            ?.signMessage({
                message: profileCreationMessage,
            })
            .catch((err) => {
                console.log('signature error: ', err);
                return;
            });

        // update account with new profile
        const updatedAccount: Account = { ...account } as Account;
        updatedAccount.profile = newProfile;
        updatedAccount.profileSignature = signature as string;

        // check if its OPTIMISM name
        if (profileNameToUpdate.endsWith('.op.dm3.eth')) {
            // start loader
            setLoaderContent('Updating profile...');
            startLoader();

            try {
                await registerOpName(provider, () => {}, profileNameToUpdate);

                // do transaction
                const response = await publishProfile(
                    provider,
                    updatedAccount,
                    profileNameToUpdate,
                );

                if (response) {
                    setNamesWithProfile((prev) => {
                        return {
                            ...prev,
                            opName: {
                                profile: newProfile,
                                isActive: true,
                            },
                        };
                    });
                }

                setProfileName(null);
                closeLoader();
            } catch (error) {
                console.log('Failed to update profile : ', error);
                closeLoader();
            }
        }

        // check if its GNOSIS name
        if (
            profileNameToUpdate?.endsWith('.gno') ||
            profileNameToUpdate?.endsWith('.gnosis.eth')
        ) {
            // start loader
            setLoaderContent('Updating profile...');
            startLoader();

            try {
                const response = await submitGenomeNameTransaction(
                    provider,
                    updatedAccount!,
                    setLoaderContent,
                    profileNameToUpdate,
                    ethAddress!,
                    () => {},
                    () => {},
                );

                if (response) {
                    setNamesWithProfile((prev) => {
                        return {
                            ...prev,
                            gnosisName: {
                                profile: newProfile,
                                isActive: true,
                            },
                        };
                    });
                }

                setProfileName(null);
                closeLoader();
            } catch (error) {
                console.log('Failed to update profile : ', error);
                closeLoader();
            }
        }

        // check if its ENS name
        if (profileNameToUpdate?.endsWith('.eth')) {
            // start loader
            setLoaderContent('Updating profile...');
            startLoader();

            try {
                const response = await submitEnsNameTransaction(
                    provider!,
                    updatedAccount!,
                    ethAddress!,
                    setLoaderContent,
                    profileNameToUpdate,
                    () => {},
                    () => {},
                );

                if (response) {
                    setNamesWithProfile((prev) => {
                        return {
                            ...prev,
                            ensName: {
                                profile: newProfile,
                                isActive: true,
                            },
                        };
                    });
                }

                setProfileName(null);
                closeLoader();
            } catch (error) {
                console.log('Failed to update profile : ', error);
                closeLoader();
            }
        }
    };

    /**
     * Adds node to the local storage
     */
    const addNode = async () => {
        setLoaderContent('Adding DS node...');
        startLoader();

        let result: boolean = true;

        // validate node name
        if (!isValidName(nodeName)) {
            result = false;
        }

        // node name must include . and end with .eth
        if (!nodeName.includes('.') || !nodeName.endsWith('.eth')) {
            result = false;
        }

        // set error if any validation fails
        if (!result) {
            setError('Invalid ENS name');
            closeLoader();
            return;
        }

        // set error if node already exists
        if (nodes.dsNames.filter((data) => data === nodeName).length) {
            setError('ENS name already exists');
            closeLoader();
            return;
        }

        // validate DS node by looking into ENS record
        if (!(await checkDsNameValidity(nodeName))) {
            setError('Invalid DS node name');
            closeLoader();
            return;
        }

        // update the DS nodes in local storage
        const updatedNodes = {
            dsNames: [...nodes.dsNames, nodeName],
        };

        // update nodes in local storage
        setDsNodesInLocalStorage(updatedNodes);

        // update node list
        setNodes(updatedNodes);

        // clear the input field
        setNodeName('');

        // clear all errors
        setError(null);

        // close the input field window
        setIsModalOpenToAddNode(false);

        // close the loader
        closeLoader();
    };

    /**
     * Deletes node from the local storage
     */
    const deleteNode = async (id: number) => {
        // filter out node to delete
        const updatedNodes = nodes.dsNames.filter((d, i) => i !== id);

        // updated nodes
        const newNodes = { dsNames: updatedNodes };

        // clear the input field
        setNodeName('');

        // clear all errors
        setError(null);

        // close the input field window
        setIsModalOpenToAddNode(false);

        // update nodes in local storage
        setDsNodesInLocalStorage(newNodes);

        // update node list
        setNodes(newNodes);
    };

    /**
     * Checks the address name profile is updated or not
     */
    const isProfileUpdatedForAddrName = useMemo(() => {
        const { addrName } = namesWithProfile;
        if (
            addrName &&
            addrName.isActive &&
            addrName.profile &&
            JSON.stringify(addrName.profile.deliveryServices) !==
                JSON.stringify(nodes.dsNames)
        ) {
            return false;
        }
        return true;
    }, [nodes, namesWithProfile]);

    /**
     * Checks the DM3/OP name profile is updated or not
     */
    const isProfileUpdatedForDm3Name = useMemo(() => {
        const { dm3Name, opName } = namesWithProfile;
        if (
            dm3Name &&
            dm3Name.isActive &&
            dm3Name.profile &&
            JSON.stringify(dm3Name.profile.deliveryServices) !==
                JSON.stringify(nodes.dsNames)
        ) {
            return false;
        }
        if (
            opName &&
            opName.isActive &&
            opName.profile &&
            JSON.stringify(opName.profile.deliveryServices) !==
                JSON.stringify(nodes.dsNames)
        ) {
            return false;
        }
        return true;
    }, [nodes, namesWithProfile]);

    /**
     * Checks the ENS/GNO name profile is updated or not
     */
    const isProfileUpdatedForEnsName = useMemo(() => {
        const { ensName, gnosisName } = namesWithProfile;
        if (
            ensName &&
            ensName.isActive &&
            ensName.profile &&
            JSON.stringify(ensName.profile.deliveryServices) !==
                JSON.stringify(nodes.dsNames)
        ) {
            return false;
        }
        if (
            gnosisName &&
            gnosisName.isActive &&
            gnosisName.profile &&
            JSON.stringify(gnosisName.profile.deliveryServices) !==
                JSON.stringify(nodes.dsNames)
        ) {
            return false;
        }
        return true;
    }, [nodes, namesWithProfile]);

    /**
     * Check profile is updated for ADDR name or not.
     * If its not updated return false.
     * Check profile is updated for DM3 name or not.
     * If its not updated return false.
     * If DM3 name profile is updated, then check ENS name profile and return true/false.
     */
    const isProfileUpdated = useMemo(() => {
        return !isProfileUpdatedForAddrName
            ? false
            : !isProfileUpdatedForDm3Name
            ? false
            : isProfileUpdatedForEnsName;
    }, [nodes, namesWithProfile]);

    const handleNodeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setNodeName(e.target.value);
    };

    const changeNetwork = (chainId: number) => {
        if (chainId !== connectedChainId && switchNetwork) {
            switchNetwork(chainId);
        }
    };

    /**
     * Validates DS name is actually a delivery service or not
     */
    const checkDsNameValidity = async (dsName: string): Promise<boolean> => {
        try {
            const resolver = await mainnetProvider.getResolver(dsName);
            if (resolver) {
                const dsProfile = await resolver.getText(
                    'network.dm3.deliveryService',
                );
                return !!dsProfile;
            }
            return false;
        } catch (error) {
            console.log('Invalid DN node : ', error);
            return false;
        }
    };

    useEffect(() => {
        initialize();
    }, [account?.ensName]);

    return {
        initialize,
        addNode,
        updateProfileForAddressName,
        updateProfileWithTransaction,
        deleteNode,
        nodes,
        isModalOpenToAddNode,
        setIsModalOpenToAddNode,
        error,
        setError,
        nodeName,
        setNodeName,
        handleNodeNameChange,
        isProfileUpdated,
        isProfileUpdatedForAddrName,
        isProfileUpdatedForDm3Name,
        isProfileUpdatedForEnsName,
        accountProfilePicture,
        setAccountProfilePicture,
    };
};
