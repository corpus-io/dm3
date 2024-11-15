import React from 'react';
import styles from './../page.module.css';
import { DM3, DM3Configuration } from '@dm3-org/dm3-messenger-widget';

export default function DM3Container() {
    const props: DM3Configuration = {
        userEnsSubdomain: process.env.NEXT_PUBLIC_USER_ENS_SUBDOMAIN as string,
        addressEnsSubdomain: process.env
            .NEXT_PUBLIC_ADDR_ENS_SUBDOMAIN as string,
        resolverBackendUrl: process.env.NEXT_PUBLIC_RESOLVER_BACKEND as string,
        profileBaseUrl: process.env.NEXT_PUBLIC_PROFILE_BASE_URL as string,
        defaultDeliveryService: process.env
            .NEXT_PUBLIC_DEFAULT_DELIVERY_SERVICE as string,
        backendUrl: process.env.NEXT_PUBLIC_BACKEND as string,
        chainId: process.env.NEXT_PUBLIC_CHAIN_ID as string,
        defaultServiceUrl: process.env.NEXT_PUBLIC_DEFAULT_SERVICE as string,
        ethereumProvider: process.env
            .NEXT_PUBLIC_MAINNET_PROVIDER_RPC as string,
        walletConnectProjectId: process.env
            .NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
        publicVapidKey: process.env.NEXT_PUBLIC_PUBLIC_VAPID_KEY as string,
        nonce: process.env.NEXT_APP_NONCE as string,
        defaultContact: 'contact.dm3.eth',
        showAlways: true,
        hideFunction: undefined, // OPTIONAL PARAMETER : 'attachments,edit,delete' or undefined
        showContacts: true, // true for all contacts / false for default contact
        theme: undefined, // OPTIONAL PARAMETER : undefined/themeColors
        signInImage: undefined, // OPTIONAL PARAMETER : string URL of image
        disableDialogOptions: undefined, // OPTIONAL PARAMETER : to enable/disable dialog properties
    };

    return (
        <div className={styles.dm3Container}>
            <DM3 {...props} />
        </div>
    );
}
