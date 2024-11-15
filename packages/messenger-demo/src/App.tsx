import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { DM3, DM3Configuration } from '@dm3-org/dm3-messenger-widget';

// interface ColoredComponentProps {
//     color: string;
//     children: React.ReactNode;
// }

// const ColoredComponent: React.FC<ColoredComponentProps> = ({
//     color,
//     children,
// }) => {
//     return (
//         <div
//             style={{
//                 backgroundColor: color,
//                 color: 'white',
//                 height: '100%',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//             }}
//         >
//             {children}
//         </div>
//     );
// };

function App() {
    const props: DM3Configuration = {
        defaultContact: 'help.dm3.eth',
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
        <div className="background p-1">
            {/* Widget in a container which has no height, so need to provide in css */}
            <div className="demo-container">
                <DM3 {...props} />
            </div>

            {/* Widget in a container which has some height already */}
            {/* <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <ColoredComponent color="yellow">
                            Gelbe Demo-Komponente
                        </ColoredComponent>
                    </div>

                    <div
                        className="demo-container"
                        style={{ flex: 1, overflow: 'auto' }}
                    >
                        <DM3 {...props} />
                    </div>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <ColoredComponent color="blue">
                            Blaue Demo-Komponente
                        </ColoredComponent>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <ColoredComponent color="green">
                            Grüne Demo-Komponente
                        </ColoredComponent>
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default App;
