/* eslint-disable max-len */
/* eslint-disable no-console */
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useContext, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { signInImage } from '../../assets/base64/home-image';
import { AuthContext } from '../../context/AuthContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { ButtonState } from '../../utils/enum-type-utils';
import DM3Logo from './DM3Logo';
import { LoginButton } from './LoginButton';
import './SignIn.css';
import { changeSignInButtonStyle } from './bl';
import { LuksoConnector } from '../../hooks/auth/lukso/LuksoConnector';
declare global {
    interface Window {
        lukso?: any;
    }
}

export function SignIn() {
    const { isConnected } = useAccount();

    const { cleanSignIn, luksoSignIn, isLoading } = useContext(AuthContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    // open rainbow wallet modal function
    const { openConnectModal } = useConnectModal();

    const handleConnectWithWallet = () => {
        openConnectionModal();
    };

    const handleSignIn = async () => {
        cleanSignIn();
    };

    // method to open connection modal
    const openConnectionModal = () => {
        changeSignInButtonStyle(
            'sign-in-btn',
            'normal-btn',
            'normal-btn-hover',
        );
        openConnectModal && openConnectModal();
    };

    const isLukso = useMemo(() => {
        return !!window.lukso;
    }, []);

    return (
        <div className="signin-container-type h-100">
            <div className="row m-0 p-0 h-100">
                <div
                    style={{
                        backgroundImage: `url(${
                            dm3Configuration.signInImage ?? signInImage
                        })`,
                    }}
                    className="col-lg-7 col-md-7 col-sm-0 p-0 home-image-container background-container"
                ></div>
                <div
                    className="signin-data-container col-lg-5 col-md-5 col-sm-12 p-0 d-flex flex-column 
                justify-content-center background-container"
                >
                    <div className="d-flex justify-content-end rainbow-connect-btn">
                        {!isConnected && (
                            <div className="normal-btn wal-not-connected">
                                Wallet not connected
                            </div>
                        )}
                    </div>

                    <div className="d-flex flex-column height-fill content-data-container">
                        <div className="d-flex flex-column justify-content-center">
                            <DM3Logo />
                        </div>

                        <div className="mt-2 w-100">
                            <div className="encrypted-details font-weight-800 font-size-12 text-primary-color">
                                web3 messaging.
                                <p className="mb-4 encrypted-details font-weight-400 font-size-12 text-primary-color">
                                    encrypted. private. decentralized.
                                    interoperable.
                                </p>
                            </div>
                        </div>

                        {!isConnected ? (
                            <LoginButton
                                text="Connect with Wallet"
                                onClick={handleConnectWithWallet}
                                buttonState={ButtonState.Ideal}
                            />
                        ) : (
                            <LoginButton
                                disabled={isLoading}
                                text={isLoading ? 'Loading' : 'Sign In'}
                                onClick={handleSignIn}
                                buttonState={
                                    isLoading
                                        ? ButtonState.Loading
                                        : ButtonState.Ideal
                                }
                            />
                        )}

                        {isLukso && (
                            <LoginButton
                                text="Sign In with Universal Profile"
                                onClick={() => luksoSignIn()}
                                buttonState={ButtonState.Ideal}
                            />
                        )}

                        <LoginButton
                            text="Test"
                            onClick={async () => {
                                const lc = await LuksoConnector._instance(
                                    dm3Configuration,
                                );
                                await lc.test();
                                console.log('done');
                            }}
                            buttonState={ButtonState.Ideal}
                        />

                        <div className="content-data para-div mt-4">
                            <p className="text-primary-color details font-size-12">
                                Connect the dm3 messenger with your wallet and
                                sign in with a signature. No need for a username
                                or password.
                            </p>
                            <p className="keys-content text-primary-color details font-size-12">
                                Keys for secure and private communication are
                                derived from this signature.
                            </p>
                            <p className="tx-content text-primary-color details font-size-12">
                                No paid transaction will be executed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
