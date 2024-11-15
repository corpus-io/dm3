<a name="readme-top"></a>
# Messenger Widget

DM3 Protocol enables decentral, open, and secure messaging based on established web3 services like ENS and IPFS.

## Getting Started

This is an example of how you may set up your project locally.
To get a local copy up and running follow these simple example steps.

## Installation

### React.js integration :
Follow the below given steps :-

1. Create a new React.js project with typescript
   ```sh
   yarn create react-app dm3-app --template typescript
   ```
2. Navigate to dm3-app directory
   ```sh
   cd dm3-app
   ```
3. Install dm3-messenger widget from yarn
   ```sh
   yarn add @dm3-org/dm3-messenger-widget
   ```
4. Create a .env file at root level of your app or project
   ```sh
   touch .env
   ```
5. Copy the below content and paste it in .env file

   #### For Sepolia testnet :
   ```ini
    REACT_APP_ADDR_ENS_SUBDOMAIN=.beta-addr.dm3.eth
    REACT_APP_BACKEND=http://134.122.95.165/api
    REACT_APP_DEFAULT_DELIVERY_SERVICE=beta-ds.dm3.eth
    REACT_APP_DEFAULT_SERVICE=http://134.122.95.165/api
    REACT_APP_MAINNET_PROVIDER_RPC=https://eth-sepolia.g.alchemy.com/v2/<alchemy-key>
    REACT_APP_PROFILE_BASE_URL=http://134.122.95.165/api
    REACT_APP_RESOLVER_BACKEND=http://134.122.95.165/resolver-handler
    REACT_APP_USER_ENS_SUBDOMAIN=.beta-user.dm3.eth
    REACT_APP_WALLET_CONNECT_PROJECT_ID=27b3e102adae76b4d4902a035da435e7
    REACT_APP_CHAIN_ID=11155111
    REACT_APP_PUBLIC_VAPID_KEY=BFCJLre0GeM6S-n4mkMX4SLZWlDR9qc8RsHyctsOPh_QDQkBuvCrMe9Rmq24736F-CJFp-3DkDWhp19X7mOJrEc
    REACT_APP_NONCE=0x123
   ```

   #### For Ethereum mainnet :
   ```ini
    REACT_APP_ADDR_ENS_SUBDOMAIN=.addr.dm3.eth
    REACT_APP_USER_ENS_SUBDOMAIN=.user.dm3.eth
    REACT_APP_BACKEND=https://app.dm3.network/api
    REACT_APP_DEFAULT_DELIVERY_SERVICE=ds.dm3.eth
    REACT_APP_DEFAULT_SERVICE=https://app.dm3.network/api
    REACT_APP_PROFILE_BASE_URL=https://app.dm3.network/api
    REACT_APP_RESOLVER_BACKEND=https://app.dm3.network/resolver-handler
    REACT_APP_WALLET_CONNECT_PROJECT_ID=27b3e102adae76b4d4902a035da435e7
    REACT_APP_MAINNET_PROVIDER_RPC=https://eth-mainnet.g.alchemy.com/v2/<alchemy-key>
    REACT_APP_CHAIN_ID=1
    REACT_APP_PUBLIC_VAPID_KEY=BFCJLre0GeM6S-n4mkMX4SLZWlDR9qc8RsHyctsOPh_QDQkBuvCrMe9Rmq24736F-CJFp-3DkDWhp19X7mOJrEc
    REACT_APP_NONCE=0x123
   ```

6. Replace the alchemy-key of REACT_APP_MAINNET_PROVIDER_RPC with your original key and REACT_APP_NONCE with some unique string
7. In the file src/App.tsx use the widget in this way
   ```js
   import { DM3, DM3Configuration } from '@dm3-org/dm3-messenger-widget';

    function App() {

        const props: DM3Configuration = {
            userEnsSubdomain: process.env.REACT_APP_USER_ENS_SUBDOMAIN as string,
            addressEnsSubdomain: process.env.REACT_APP_ADDR_ENS_SUBDOMAIN as string,
            resolverBackendUrl: process.env.REACT_APP_RESOLVER_BACKEND as string,
            profileBaseUrl: process.env.REACT_APP_PROFILE_BASE_URL as string,
            defaultDeliveryService: process.env.REACT_APP_DEFAULT_DELIVERY_SERVICE as string,
            backendUrl: process.env.REACT_APP_BACKEND as string,
            chainId: process.env.REACT_APP_CHAIN_ID as string,
            defaultServiceUrl: process.env.REACT_APP_DEFAULT_SERVICE as string,
            ethereumProvider: process.env.REACT_APP_MAINNET_PROVIDER_RPC as string,
            walletConnectProjectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
            publicVapidKey: process.env.REACT_APP_PUBLIC_VAPID_KEY as string,
            nonce: process.env.REACT_APP_NONCE as string,
            defaultContact: 'help.dm3.eth',
            showAlways: true,
            hideFunction: undefined, 
            showContacts: true,
            theme: undefined, 
            signInImage: undefined,
            siwe: undefined,
            disableDialogOptions: undefined,
        };

        return (
            <div className="demo-container">
                <DM3 {...props} />
            </div>
        );
    }

    export default App;
   ```
8. Add the following style to the dm3-container in App.css file
   ```css
    .demo-container {
        border-radius: 25px;  /* Optional property */
        overflow: hidden;  /* Optional property only if wanted set border radius */
        height: 100vh; /* If the container has no height, then it is mandatory to set some height*/
        width: 100vw; /* If the container has no width, then it is mandatory to set some width */
    }
   ```
9. Start the project by running following command in terminal
   ```sh
    yarn start
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Next.js integration :
Follow the below given steps :-

1. Create a new Next.js project with typescript
   ```sh
   yarn create next-app
   ```
2. It will prompt a few options to choose for the next app configuration. Follow the options selected below : 
   ```js
   ✔ What is your project named? … dm3-app
   ✔ Would you like to use TypeScript? … Yes
   ✔ Would you like to use ESLint? … Yes
   ✔ Would you like to use Tailwind CSS? … No
   ✔ Would you like to use `src/` directory? … No
   ✔ Would you like to use App Router? (recommended) … Yes
   ✔ Would you like to customize the default import alias (@/*)? … No
   ```
3. Navigate to dm3-app directory
   ```sh
   cd dm3-app
   ```
4. Install dm3-messenger widget from yarn
   ```sh
   yarn add @dm3-org/dm3-messenger-widget
   ```
5. Create a .env file at root level of your app or project
   ```sh
   touch .env
   ```
6. Copy the below content and paste it in .env file

   #### For Sepolia testnet :
   ```ini
    NEXT_PUBLIC_ADDR_ENS_SUBDOMAIN=.beta-addr.dm3.eth
    NEXT_PUBLIC_BACKEND=http://134.122.95.165/api
    NEXT_PUBLIC_DEFAULT_DELIVERY_SERVICE=beta-ds.dm3.eth
    NEXT_PUBLIC_DEFAULT_SERVICE=http://134.122.95.165/api
    NEXT_PUBLIC_MAINNET_PROVIDER_RPC=https://eth-sepolia.g.alchemy.com/v2/<alchemy-key>
    NEXT_PUBLIC_PROFILE_BASE_URL=http://134.122.95.165/api
    NEXT_PUBLIC_RESOLVER_BACKEND=http://134.122.95.165/resolver-handler
    NEXT_PUBLIC_USER_ENS_SUBDOMAIN=.beta-user.dm3.eth
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=27b3e102adae76b4d4902a035da435e7
    NEXT_PUBLIC_CHAIN_ID=11155111
    NEXT_PUBLIC_PUBLIC_VAPID_KEY=BFCJLre0GeM6S-n4mkMX4SLZWlDR9qc8RsHyctsOPh_QDQkBuvCrMe9Rmq24736F-CJFp-3DkDWhp19X7mOJrEc
    NEXT_PUBLIC_NONCE=0x123
   ```

   #### For Ethereum mainnet :
   ```ini
    NEXT_PUBLIC_ADDR_ENS_SUBDOMAIN=.addr.dm3.eth
    NEXT_PUBLIC_USER_ENS_SUBDOMAIN=.user.dm3.eth
    NEXT_PUBLIC_BACKEND=https://app.dm3.network/api
    NEXT_PUBLIC_DEFAULT_DELIVERY_SERVICE=ds.dm3.eth
    NEXT_PUBLIC_DEFAULT_SERVICE=https://app.dm3.network/api
    NEXT_PUBLIC_PROFILE_BASE_URL=https://app.dm3.network/api
    NEXT_PUBLIC_RESOLVER_BACKEND=https://app.dm3.network/resolver-handler
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=27b3e102adae76b4d4902a035da435e7
    NEXT_PUBLIC_MAINNET_PROVIDER_RPC=https://eth-mainnet.g.alchemy.com/v2/<alchemy-key>
    NEXT_PUBLIC_CHAIN_ID=1
    NEXT_PUBLIC_PUBLIC_VAPID_KEY=BFCJLre0GeM6S-n4mkMX4SLZWlDR9qc8RsHyctsOPh_QDQkBuvCrMe9Rmq24736F-CJFp-3DkDWhp19X7mOJrEc
    NEXT_PUBLIC_NONCE=0x123
   ```

7. Replace the alchemy-key of NEXT_PUBLIC_MAINNET_PROVIDER_RPC with your original key and NEXT_PUBLIC_NONCE with some unique string
8. Add the following properties in next.config.mjs file 
   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
      reactStrictMode: true,
      // This is done to support SVG & other images rendering
      webpack: config => {
         config.externals.push('pino-pretty', 'lokijs', 'encoding');
         config.module.rules.push({
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
            use: {
                  loader: 'url-loader',
                  options: {
                     limit: 100000
                  }
            }
         });
         return config;
      },
      env: {
         REACT_APP_ADDR_ENS_SUBDOMAIN: process.env.NEXT_PUBLIC_ADDR_ENS_SUBDOMAIN,
         REACT_APP_USER_ENS_SUBDOMAIN: process.env.NEXT_PUBLIC_USER_ENS_SUBDOMAIN,
         REACT_APP_BACKEND: process.env.NEXT_PUBLIC_BACKEND,
         REACT_APP_DEFAULT_DELIVERY_SERVICE: process.env.NEXT_PUBLIC_DEFAULT_DELIVERY_SERVICE,
         REACT_APP_DEFAULT_SERVICE: process.env.NEXT_PUBLIC_DEFAULT_SERVICE,
         REACT_APP_PROFILE_BASE_URL: process.env.NEXT_PUBLIC_PROFILE_BASE_URL,
         REACT_APP_RESOLVER_BACKEND: process.env.NEXT_PUBLIC_RESOLVER_BACKEND,
         REACT_APP_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
         REACT_APP_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
         REACT_APP_MAINNET_PROVIDER_RPC: process.env.NEXT_PUBLIC_MAINNET_PROVIDER_RPC,
         REACT_APP_PUBLIC_VAPID_KEY: process.env.NEXT_PUBLIC_PUBLIC_VAPID_KEY,
         REACT_APP_NONCE: process.env.NEXT_PUBLIC_NONCE,
      },
   };

   export default nextConfig;
   ```
9. In the file app/page.tsx use the widget in this way
   ```js
   'use client';
   import styles from "./page.module.css";
   import { DM3, DM3Configuration } from '@dm3-org/dm3-messenger-widget';

    export default function Home() {

        const props: DM3Configuration = {
            userEnsSubdomain: process.env.REACT_APP_USER_ENS_SUBDOMAIN as string,
            addressEnsSubdomain: process.env.REACT_APP_ADDR_ENS_SUBDOMAIN as string,
            resolverBackendUrl: process.env.REACT_APP_RESOLVER_BACKEND as string,
            profileBaseUrl: process.env.REACT_APP_PROFILE_BASE_URL as string,
            defaultDeliveryService: process.env.REACT_APP_DEFAULT_DELIVERY_SERVICE as string,
            backendUrl: process.env.REACT_APP_BACKEND as string,
            chainId: process.env.REACT_APP_CHAIN_ID as string,
            defaultServiceUrl: process.env.REACT_APP_DEFAULT_SERVICE as string,
            ethereumProvider: process.env.REACT_APP_MAINNET_PROVIDER_RPC as string,
            walletConnectProjectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
            publicVapidKey: process.env.REACT_APP_PUBLIC_VAPID_KEY as string,
            nonce: process.env.REACT_APP_NONCE as string,
            defaultContact: 'help.dm3.eth',
            showAlways: true,
            hideFunction: undefined, 
            showContacts: true,
            theme: undefined, 
            signInImage: undefined,
            siwe: undefined,
            disableDialogOptions: undefined,
        };

        return (
            <main className={styles.dm3Container}>
               <DM3 {...props} />
            </main>
        );
    }
   ```
10. Add the following style to the dm3Container in page.module.css file
   ```css
   .demo-container {
      border-radius: 25px;  /* Optional property */
      overflow: hidden;  /* Optional property only if wanted set border radius */
      height: 100vh; /* If the container has no height, then it is mandatory to set some height*/
      width: 100vw; /* If the container has no width, then it is mandatory to set some width */
   }
   ```
11. Start the project by running following command in terminal
```sh
yarn run dev
```

#### NOTE :
```sh
1. Next.js version should be equal or greater than 13 to use the DM3 library.
2. Next.js app must contain app directory. It should not use the pages directory like the old version.
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Vite App integration :

1. Create a new vite app with typescript.
2. Follow all the steps similar to React.js integration.
3. Don't create .env file instead use the below configuration.
4. Add the following properties in vite.config.ts file. 

   #### For Sepolia testnet :

   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
      plugins: [react()],
      define: {
         'process.env': {
            REACT_APP_ADDR_ENS_SUBDOMAIN: ".beta-addr.dm3.eth",
            REACT_APP_BACKEND: "http://134.122.95.165/api",
            REACT_APP_DEFAULT_DELIVERY_SERVICE: "beta-ds.dm3.eth",
            REACT_APP_DEFAULT_SERVICE: "http://134.122.95.165/api",
            REACT_APP_MAINNET_PROVIDER_RPC: "https://eth-sepolia.g.alchemy.com/v2/<alchemy-key>",
            REACT_APP_PROFILE_BASE_URL: "http://134.122.95.165/api",
            REACT_APP_RESOLVER_BACKEND: "http://134.122.95.165/resolver-handler",
            REACT_APP_USER_ENS_SUBDOMAIN: ".beta-user.dm3.eth",
            REACT_APP_WALLET_CONNECT_PROJECT_ID: "27b3e102adae76b4d4902a035da435e7",
            REACT_APP_CHAIN_ID: "11155111",
            REACT_APP_PUBLIC_VAPID_KEY: "BFCJLre0GeM6S-n4mkMX4SLZWlDR9qc8RsHyctsOPh_QDQkBuvCrMe9Rmq24736F-CJFp-3DkDWhp19X7mOJrEc",
            REACT_APP_NONCE: "0x123"
         }
      }
   })
   ```


   #### For Ethereum mainnet :

   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
      plugins: [react()],
      define: {
         'process.env': {
            REACT_APP_ADDR_ENS_SUBDOMAIN: ".addr.dm3.eth",
            REACT_APP_BACKEND: "https://app.dm3.network/api",
            REACT_APP_DEFAULT_DELIVERY_SERVICE: "ds.dm3.eth",
            REACT_APP_DEFAULT_SERVICE: "https://app.dm3.network/api",
            REACT_APP_MAINNET_PROVIDER_RPC: "https://eth-sepolia.g.alchemy.com/v2/<alchemy-key>",
            REACT_APP_PROFILE_BASE_URL: "https://app.dm3.network/api",
            REACT_APP_RESOLVER_BACKEND: "https://app.dm3.network/resolver-handler",
            REACT_APP_USER_ENS_SUBDOMAIN: ".user.dm3.eth",
            REACT_APP_WALLET_CONNECT_PROJECT_ID: "27b3e102adae76b4d4902a035da435e7",
            REACT_APP_CHAIN_ID: "1",
            REACT_APP_PUBLIC_VAPID_KEY: "BFCJLre0GeM6S-n4mkMX4SLZWlDR9qc8RsHyctsOPh_QDQkBuvCrMe9Rmq24736F-CJFp-3DkDWhp19X7mOJrEc",
            REACT_APP_NONCE: "0x123"
         }
      }
   })
   ```
5. Start the project by running following command in terminal
   ```sh
   yarn run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

#### Widget props customization :

1. nonce
```js
const props: DM3Configuration = {
   ...
   nonce: '0x123',
}
```
This is a nonce value which is used in the storage as a key. Its is a unique value for each client. It is mandatory property.
```js
Example : 
   nonce: '0x23281'
   nonce: '0x9123821'
```

2. defaultContact
```js
const props: DM3Configuration = {
   ...
   defaultContact: 'help.dm3.eth',
}
```
This is default contact's ENS name which is set in the contact list. It will be by default added in the contact list when the widget is used and no need to add the contact explicitly. It is mandatory property.
```js
Example : 
   defaultContact: 'help.dm3.eth'
   defaultContact: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F.dm3.eth'
```

3. hideFunction
```js
const props: DM3Configuration = {
   ...
   hideFunction: 'attachments',
}
```
This is a optional property and not mandatory to set. Its by default undefined. User can set the functionalities to be hided in the widget using this. Multiple properties can be set separated by comma.
```js
Example : 
   hideFunction: 'attachments'
   hideFunction: 'edit'
   hideFunction: 'delete'
   hideFunction: 'edit,delete'
   hideFunction: 'attachments,edit,delete'
   hideFunction: undefined
```

4. showContacts
```js
const props: DM3Configuration = {
   ...
   showContacts: true,
}
```
This is a mandatory property of type boolean. The value true enables the widget to show entire contacts list and many contacts can be added in the list dynamically.
The value false represents only the default contact is active and chatting can be done with that contact only.
```js
Example : 
   showContacts: true
   showContacts: false
```

5. signInImage
```js
const props: DM3Configuration = {
   ...
   signInImage: "https://myimage.png",
}
```
This is a optional property of type string. The base64 string url of any image can be set or any web url of an image. This is a image to be shown on Sign in screen of widget.
```js
Example : 
   signInImage: undefined
   signInImage: "https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg"
```

6. siwe
```js
const props: DM3Configuration = {
   ...
   siwe: {
        address: "0xe7861D923e1B055bB25CD49569d20903c44692c5",
        message: "my msg",
        signature: '0xc9c8df80009a302559642d67adeea12d6e3f2ecbd7702986596b4012a5f5956e70c2a2c658f7c02e9255499049ea518fdf714cadc121b0319aee80f7ae28b0181b',
        secret: "my-super-secret0"
    },
}
```
This is a optional property of type object. Using this one can signin into DM3 with the SIWE (Sign In With Ethereum). All the properties of the object are mandatory.


#### Address : 
The address of the user's wallet
#### Message : 
The login message. This can be any SIWE-like message. This message might not be confidential and also could contain a timestamp.
#### Signature : 
The signature to the above message.
#### Secret : 
A unique secret identifier This value is the secret entropy to be used as a seed for the internal keys to be derived from. It must not be shared anywhere else. Also, the embedding app is responsible for storing this securely, as it is "the key" for the communication. For instance, this could be a derivation, signature,... from an internally used private key.
IMPORTANT The embedding app is responsible for security, recovery, etc.

```js
Example : 
   siwe: undefined
   siwe: {
        address: "0xe7861D923e1B055bB25CD49569d20903c44692c5",
        message: "my msg",
        signature: '0xc9c8df80009a302559642d67adeea12d6e3f2ecbd7702986596b4012a5f5956e70c2a2c658f7c02e9255499049ea518fdf714cadc121b0319aee80f7ae28b0181b',
        secret: "my-super-secret0"
    }
```

7. disableDialogOptions
```js
const props: DM3Configuration = {
   ...
   disableDialogOptions: true,
}
```
This is a optional property of type DisableDialogType. To disable all the properties of dialog set it true. By default all properties are active. All the properties of each category is optional.
```js
Example : 
   disableDialogOptions: true
   disableDialogOptions: false
   disableDialogOptions: undefined
   disableDialogOptions: {
      network: true,
      notification: {
         email: true,
         push: false,
      },
      profile: {
         dm3: {
            cloud: false,
            optimism: true,
         },
         self: {
            gnosis: true,
            ens: false,
         }
      },
      settings: {
         messageView: true,
      }
   }
   disableDialogOptions: {
      notification: {
         email: true,
         push: false,
      },
   }
```

8. theme
```js
const props: DM3Configuration = {
   ...
   theme: undefined, 
}
```
This is a optional property of type object. Its used to customize the styling, look & feel of the widget. Colors can be set for different components.
```js
Example : 
   theme: undefined
   theme: {
      backgroundColor: '#eeeeee',
      buttonBorderColor: '#dddddd',
      configBoxBorderColor: 'red',
      buttonColor: 'darkgray',
      hoverButtonColor: 'chocolate',
      inactiveButtonColor: 'sieena',
      primaryTextColor: 'black',
      secondaryTextColor: 'white',
      activeContactBackgroundColor: 'dimgray',
      configurationBoxBackgroundColor: 'darkgrey',
      configurationBoxBorderColor: '#666876',
      chatBackgroundColor: '#5c5e54',
      disabledButtonTextColor: 'burlywood',
      errorTextColor: '#C30F1A',
      errorBackgroundColor: '#830B12',
      attachmentBackgroundColor: '#202129',
      selectedContactBorderColor: 'orange',
      profileConfigurationTextColor: 'pink',
      receivedMessageBackgroundColor: 'pink',
      receivedMessageTextColor: 'white',
      sentMessageBackgroundColor: 'blue',
      sentMessageTextColor: 'white',
      infoBoxBackgroundColor: 'green',
      infoBoxTextColor: 'yellow',
      buttonShadow: '#000000',
      msgCounterBackgroundColor: 'yellow',
      msgCounterTextColor: 'white',
      scrollbarBackgroundColor: 'black',
      scrollbarScrollerColor: 'white',
      inputFieldBackgroundColor: 'saddlebrown',
      inputFieldTextColor: '#FFFF',
      inputFieldBorderColor: '#81828D',
      emojiModalBackgroundColor: '262, 240, 283', // It must be in RGB format EX: 240,248,255
      emojiModalTextColor: '102, 51, 153', // It must be in RGB format EX: 240,248,255
      emojiModalAccentColor: '255, 105, 180', // It must be in RGB format EX: 240,248,255
      rainbowConnectBtnBackgroundColor: 'blue',
      rainbowConnectBtnTextColor: 'white',
      rainbowAccentColor: 'orange',
      rainbowAccentForegroundColor: 'pink',
      rainbowModalTextColor: 'white',
      rainbowModalTextSecondaryColor: 'yellow',
      rainbowModalWalletHoverColor: 'green',
      rainbowModalBackgroundColor: 'blue',
      alternateContactBackgroundColor: 'black',
      menuBackgroundColor: 'blue',
      preferencesHighlightedColor: '#8b7ff4',
      configureProfileModalBackgroundColor: '#D9D9D9',
   }
```

#### NOTE : 
`Rest all other properties are mandatory and not customizable. They must have the value as shown in the .env configuration.`