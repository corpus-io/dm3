import {
    DM3ConfigurationContext,
    DM3ConfigurationContextType,
} from '../DM3ConfigurationContext';

//Provide a mocked DM3Configuration context
//Override the default values with the provided values
export const getMockedDm3Configuration = (
    override?: Partial<DM3ConfigurationContextType>,
) => {
    return { ...DM3ConfigurationContext, ...override };
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
