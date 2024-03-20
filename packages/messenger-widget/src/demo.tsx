import { DM3, DM3Configuration } from './widget';

export function Demo() {
    const props: DM3Configuration = {
        userEnsSubdomain: process.env.REACT_APP_USER_ENS_SUBDOMAIN as string,
        addressEnsSubdomain: process.env.REACT_APP_ADDR_ENS_SUBDOMAIN as string,
        resolverBackendUrl: process.env.REACT_APP_RESOLVER_BACKEND as string,
        profileBaseUrl: process.env.REACT_APP_PROFILE_BASE_URL as string,
        defaultDeliveryService: process.env
            .REACT_APP_DEFAULT_DELIVERY_SERVICE as string,
        backendUrl: process.env.REACT_APP_BACKEND as string,
        chainId: process.env.REACT_APP_CHAIN_ID as string,
        resolverAddress: process.env.REACT_APP_RESOLVER_ADDR as string,
        defaultServiceUrl: process.env.REACT_APP_DEFAULT_SERVICE as string,
        ethereumProvider: process.env.REACT_APP_ETHEREUM_PROVIDER as string,
        walletConnectProjectId: process.env
            .REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
        defaultContact: 'defaultcontact.eth',
        showAlways: true,
        hideFunction: undefined, // OPTIONAL PARAMETER : 'attachments,edit,delete' or undefined
        showContacts: true, // true for all contacts / false for default contact
        theme: undefined, // OPTIONAL PARAMETER : undefined/themeColors
        signInImage: undefined, // OPTIONAL PARAMETER : string URL of image
    };

    return (
        <div style={{ height: '100vh' }}>
            <DM3 {...props} />
        </div>
    );
}
