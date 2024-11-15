/* eslint-disable max-len */
/* eslint-disable no-console */
import {
    connectorsForWallets,
    darkTheme,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import {
    metaMaskWallet,
    rainbowWallet,
    walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { useMemo } from 'react';
import {
    configureChains,
    createConfig,
    mainnet,
    sepolia,
    WagmiConfig,
} from 'wagmi';
import { gnosis, optimism, optimismSepolia } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import DM3 from '../../components/DM3/DM3';
import { AuthContextProvider } from '../../context/AuthContext';
import { BackendContextProvider } from '../../context/BackendContext';
import { DeliveryServiceContextProvider } from '../../context/DeliveryServiceContext';
import { DM3ConfigurationContextProvider } from '../../context/DM3ConfigurationContext';
import { ModalContextProvider } from '../../context/ModalContext';
import { MainnetProviderContextProvider } from '../../context/ProviderContext';
import { StorageContextProvider } from '../../context/StorageContext';
import { TLDContextProvider } from '../../context/TLDContext';
import { UiViewContextProvider } from '../../context/UiViewContext';
import { Dm3Props } from '../../interfaces/config';
import './Home.css';
import { SettingsContextProvider } from '../../context/SettingsContext';

export function Home(props: Dm3Props) {
    /**
     * Use different chains depending on the environment.
     * Note that gnosis mainnet is used for both setups.
     * Its because there is no spaceId testnet deployment yet.
     */
    const _chains =
        props.config.chainId === '1'
            ? [mainnet, optimism, gnosis]
            : [sepolia, optimismSepolia, gnosis];

    const { chains, publicClient } = configureChains(
        [..._chains],
        [
            jsonRpcProvider({
                rpc: () => ({
                    http: props.config.ethereumProvider as string,
                }),
            }),
        ],
    );

    const connectors = useMemo(() => {
        return connectorsForWallets([
            {
                groupName: 'Popular',
                wallets: [
                    rainbowWallet({
                        projectId: props.config
                            .walletConnectProjectId as string,
                        chains,
                    }),
                    metaMaskWallet({
                        projectId: props.config
                            .walletConnectProjectId as string,
                        chains,
                    }),
                    walletConnectWallet({
                        projectId: props.config
                            .walletConnectProjectId as string,
                        chains,
                    }),
                ],
            },
        ]);
    }, []);

    const wagmiConfig = useMemo(() => {
        return createConfig({
            autoConnect: true,
            connectors,
            publicClient,
        });
    }, []);

    return (
        <div className="h-100 position-relative">
            <WagmiConfig config={wagmiConfig}>
                <RainbowKitProvider chains={chains} theme={darkTheme()}>
                    <DM3ConfigurationContextProvider>
                        <UiViewContextProvider>
                            <ModalContextProvider>
                                <MainnetProviderContextProvider
                                    dm3Configuration={props.config}
                                >
                                    <TLDContextProvider>
                                        <AuthContextProvider>
                                            <SettingsContextProvider>
                                                <DeliveryServiceContextProvider>
                                                    <BackendContextProvider>
                                                        <StorageContextProvider>
                                                            <DM3
                                                                config={
                                                                    props.config
                                                                }
                                                            />
                                                        </StorageContextProvider>
                                                    </BackendContextProvider>
                                                </DeliveryServiceContextProvider>
                                            </SettingsContextProvider>
                                        </AuthContextProvider>
                                    </TLDContextProvider>
                                </MainnetProviderContextProvider>
                            </ModalContextProvider>
                        </UiViewContextProvider>
                    </DM3ConfigurationContextProvider>
                </RainbowKitProvider>
            </WagmiConfig>
        </div>
    );
}
