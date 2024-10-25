import { SiweValidityStatus } from '../../utils/enum-type-utils';
import { DM3Configuration, Siwe } from '../../widget';
import { DM3ConfigurationContextType } from '../DM3ConfigurationContext';

//Provide a mocked DM3Configuration context
//Override the default values with the provided values
export const getMockedDm3Configuration = (
    override?: Partial<DM3ConfigurationContextType>,
) => {
    const defaultValue = {
        setDm3Configuration: (configuration: DM3Configuration) => {},
        dm3Configuration: {
            defaultContact: '',
            defaultServiceUrl: '',
            ethereumProvider: '',
            walletConnectProjectId: '',
            userEnsSubdomain: '',
            addressEnsSubdomain: '',
            resolverBackendUrl: '',
            profileBaseUrl: '',
            defaultDeliveryService: '',
            backendUrl: '',
            chainId: '',
            showAlways: true,
            showContacts: true,
            publicVapidKey: '',
            nonce: '',
        },
        screenWidth: window.innerWidth,
        setScreenWidth: (width: number) => {},
        siweValidityStatus: SiweValidityStatus.TO_BE_INITIATED,
        setSiweValidityStatus: (status: SiweValidityStatus) => {},
        validateSiweCredentials: (data: Siwe) => {},
    };

    return { ...defaultValue, ...override };
};

export const DEFAULT_DM3_CONFIGURATION = {
    defaultContact: '',
    defaultServiceUrl: '',
    ethereumProvider: '',
    walletConnectProjectId: '',
    userEnsSubdomain: '',
    addressEnsSubdomain: '',
    resolverBackendUrl: '',
    profileBaseUrl: '',
    defaultDeliveryService: '',
    backendUrl: '',
    chainId: '',
    resolverAddress: '',
    showAlways: false,
    showContacts: false,
    publicVapidKey: '',
    nonce: '',
    disableNetworkDialog: false,
};
