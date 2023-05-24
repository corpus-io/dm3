import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { decryptAsymmetric } from 'dm3-lib-crypto';
import { EncryptionEnvelop, MessageState, Postmark } from 'dm3-lib-messaging';
import { getDeliveryServiceProfile } from 'dm3-lib-profile';
import { log } from 'dm3-lib-shared';
import { UserDB } from 'dm3-lib-storage';
import { useContext, useEffect, useState } from 'react';
import { useBeforeunload } from 'react-beforeunload';
import 'react-chat-widget/lib/styles.css';
import socketIOClient from 'socket.io-client';
import './Dm3.css';
import { GlobalContext } from './GlobalContextProvider';
import LeftView from './LeftView';
import RightView from './RightView';
import { ConnectionType } from './reducers/Connection';
import { UiStateType } from './reducers/UiState';
import { UserDbType } from './reducers/UserDB';
import { showSignIn } from './sign-in/Phases';
import SignIn from './sign-in/SignIn';
import Start from './start/Start';
import Help from './ui-shared/Help';
import { requestContacts } from './ui-shared/contacts/RequestContacts';
import { Config } from './utils/Config';
import { Connection, ConnectionState } from './web3provider/Web3Provider';

interface dm3Props {
    config: Config;
}

function dm3(props: dm3Props) {
    const { state, dispatch } = useContext(GlobalContext);

    const [deliveryServiceUrl, setdeliveryServiceUrl] = useState('');

    if (state.userDb?.synced && props.config.warnBeforeLeave) {
        useBeforeunload();
    } else if (props.config.warnBeforeLeave) {
        useBeforeunload(
            () =>
                "The app is out of sync with the database. You'll loose your new messages.",
        );
    }

    useEffect(() => {
        if (props.config.connectionStateChange) {
            props.config.connectionStateChange(
                state.connection.connectionState,
            );
        }
    }, [state.connection.connectionState]);

    useEffect(() => {
        dispatch({
            type: ConnectionType.SetDefaultServiceUrl,
            payload: props.config.defaultServiceUrl,
        });
    }, [props.config.defaultServiceUrl]);

    useEffect(() => {
        dispatch({
            type: UiStateType.SetBrowserStorageBackup,
            payload: props.config.browserStorageBackup,
        });
    }, [props.config.browserStorageBackup]);

    useEffect(() => {
        if (
            props.config.showContacts === false &&
            state.accounts.selectedContact
        ) {
            dispatch({
                type: UiStateType.SetMaxLeftView,
                payload: false,
            });
        }
    }, [state.accounts.selectedContact]);

    useEffect(() => {
        if (state.connection.provider) {
            if (
                window.ethereum &&
                state.connection.connectionState === ConnectionState.SignedIn
            ) {
                (window.ethereum as any).on('accountsChanged', () => {
                    window.location.reload();
                });
                (window.ethereum as any).on('chainChanged', () => {
                    window.location.reload();
                });
            }
        }
    }, [state.connection.provider, state.connection.connectionState]);

    useEffect(() => {
        const getDeliveryServiceUrl = async () => {
            if (deliveryServiceUrl !== '') {
                return;
            }
            if (state?.connection?.account?.profile === undefined) {
                return;
            }
            const deliveryServiceProfile = await getDeliveryServiceProfile(
                //TODO Implement usage of all delivery services
                //https://github.com/corpus-ventures/dm3/issues/330
                state.connection.account.profile.deliveryServices[0],
                state.connection.provider!,
                async (url: string) => (await axios.get(url)).data,
            );
            setdeliveryServiceUrl(deliveryServiceProfile!.url);
        };

        getDeliveryServiceUrl();
    }, [state.connection.account?.profile]);

    useEffect(() => {
        if (
            state.connection.connectionState === ConnectionState.SignedIn &&
            !state.connection.socket &&
            deliveryServiceUrl
        ) {
            if (!state.userDb) {
                throw Error(
                    `Couldn't handle new messages. User db not created.`,
                );
            }

            if (!state.connection.account?.profile) {
                throw Error('Could not get account profile');
            }

            const socket = socketIOClient(deliveryServiceUrl, {
                autoConnect: false,
            });

            socket.auth = {
                account: state.connection.account,
                token: state.auth.currentSession!.token,
            };
            socket.connect();
            socket.on('message', (envelop: EncryptionEnvelop) => {
                handleNewMessage(envelop);
            });
            socket.on('joined', () => {
                getContacts(state.connection as Connection);
            });
            dispatch({ type: ConnectionType.ChangeSocket, payload: socket });
        }
    }, [
        state.connection.connectionState,
        state.connection.socket,
        deliveryServiceUrl,
    ]);

    useEffect(() => {
        if (state.accounts.selectedContact && state.connection.socket) {
            state.connection.socket.removeAllListeners();

            state.connection.socket.on(
                'message',
                (envelop: EncryptionEnvelop) => {
                    handleNewMessage(envelop);
                },
            );

            state.connection.socket.on('joined', () => {
                getContacts(state.connection as Connection);
            });
        }
    }, [state.connection.socket, state.userDb?.conversations]);

    const getContacts = (connection: Connection) => {
        if (!state.userDb) {
            throw Error(
                `[getContacts] Couldn't handle new messages. User db not created.`,
            );
        }

        log('[getContacts]', 'info');

        return requestContacts(
            state,
            dispatch,

            props.config.defaultContact,
        );
    };

    const handleNewMessage = async (envelop: EncryptionEnvelop) => {
        log('New messages', 'info');

        const message = JSON.parse(
            await decryptAsymmetric(
                (state.userDb as UserDB).keys.encryptionKeyPair,
                JSON.parse(envelop.message),
            ),
        );
        const postmark: Postmark = JSON.parse(
            await decryptAsymmetric(
                (state.userDb as UserDB).keys.encryptionKeyPair,
                JSON.parse(envelop.postmark!),
            ),
        );

        if (!state.userDb) {
            throw Error(
                `[handleNewMessage] Couldn't handle new messages. User db not created.`,
            );
        }

        if (!postmark.incommingTimestamp) {
            throw Error(`[handleNewMessage] No delivery service timestamp`);
        }

        dispatch({
            type: UserDbType.addMessage,
            payload: {
                container: {
                    envelop: {
                        message,
                        postmark,
                        metadata: envelop.metadata,
                    },
                    messageState: MessageState.Send,
                    deliveryServiceIncommingTimestamp:
                        postmark.incommingTimestamp,
                },
                connection: state.connection as Connection,
            },
        });
    };

    const showHelp =
        state.connection.connectionState === ConnectionState.SignedIn &&
        state.accounts.contacts &&
        state.accounts.contacts.length <= 1 &&
        state.uiState.maxLeftView &&
        props.config.showHelp;

    const mainContent = (
        <>
            {showHelp && <Help />}

            <div
                className={`row main-content-row ${showHelp ? '' : 'mt-5'}`}
                style={props.config.style}
            >
                <div className="col-12 h-100">
                    <div className="row h-100">
                        {showSignIn(state.connection.connectionState) ? (
                            <SignIn
                                hideStorageSelection={
                                    props.config.hideStorageSelection
                                }
                                defaultStorageLocation={
                                    props.config.defaultStorageLocation
                                }
                                miniSignIn={props.config.miniSignIn}
                            />
                        ) : (
                            <>
                                <LeftView getContacts={getContacts} />
                                <RightView />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    return props.config.inline ? (
        mainContent
    ) : (
        <>
            {(state.uiState.show || props.config.showAlways) && (
                <div
                    className="filler"
                    onClick={() =>
                        dispatch({
                            type: UiStateType.ToggleShow,
                        })
                    }
                >
                    <div
                        className="container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {mainContent}
                    </div>
                </div>
            )}
            {!props.config.showAlways && <Start />}
        </>
    );
}

export default dm3;
