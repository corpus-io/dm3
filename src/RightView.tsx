import React, { useContext } from 'react';
import 'react-chat-widget/lib/styles.css';
import * as Lib from './lib';

import Start from './Start';
import Chat, { EnvelopContainer } from './chat/Chat';
import SignInHelp from './sign-in/SignInHelp';
import { showSignIn } from './sign-in/Phases';
import { GlobalContext } from './GlobalContextProvider';

function RightView() {
    const { state, dispatch } = useContext(GlobalContext);
    return (
        <div className="col-md-8 content-container h-100">
            {state.connection.connectionState ===
                Lib.ConnectionState.NoProvider && (
                <div className="col-md-12 text-center row-space">
                    No Ethereum provider detected. Please install a plugin like
                    MetaMask.
                </div>
            )}

            {(!state.accounts.selectedContact ||
                state.connection.connectionState ===
                    Lib.ConnectionState.KeyCreation) && (
                <div className="start-chat">
                    {state.connection.provider &&
                        showSignIn(state.connection.connectionState) && (
                            <div className="col-md-12 text-center">
                                <SignInHelp />
                            </div>
                        )}
                    {state.connection.connectionState ===
                        Lib.ConnectionState.SignedIn && <Start />}
                </div>
            )}

            {state.connection.connectionState ===
                Lib.ConnectionState.SignedIn &&
                state.accounts.selectedContact && (
                    <Chat
                        contact={state.accounts.selectedContact}
                        connection={state.connection}
                    />
                )}
        </div>
    );
}

export default RightView;
