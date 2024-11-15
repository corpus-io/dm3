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
        defaultServiceUrl: process.env.REACT_APP_DEFAULT_SERVICE as string,
        ethereumProvider: process.env.REACT_APP_MAINNET_PROVIDER_RPC as string,
        walletConnectProjectId: process.env
            .REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
        publicVapidKey: process.env.REACT_APP_PUBLIC_VAPID_KEY as string,
        defaultContact: 'defaultcontact.eth',
        nonce: process.env.REACT_APP_NONCE as string,
        showAlways: true,
        hideFunction: undefined, // OPTIONAL PARAMETER : 'attachments,edit,delete' or undefined
        showContacts: true, // true for all contacts / false for default contact
        theme: undefined, // OPTIONAL PARAMETER : undefined/themeColors
        signInImage: undefined, // OPTIONAL PARAMETER : string URL of image
        siwe: undefined, // OPTIONAL PARAMETER : sign in with ethereum
        disableDialogOptions: undefined, // OPTIONAL PARAMETER : to enable/disable dialog properties
    };

    return (
        <div style={{ height: '100vh' }}>
            <DM3 {...props} />
        </div>
    );
}
