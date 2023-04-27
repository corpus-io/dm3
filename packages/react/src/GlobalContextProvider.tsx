import React, { Dispatch } from 'react';
import { AccountsActions, accountsReducer } from './reducers/Accounts';
import { AuthStateActions, authReducer } from './reducers/Auth';
import { CacheActions, cacheReducer } from './reducers/Cache';
import { ConnectionActions, connectionReducer } from './reducers/Connection';
import { UiStateActions, uiStateReducer } from './reducers/UiState';
import { UserDbActions, userDbReducer } from './reducers/UserDB';
import { GlobalState, initialState } from './reducers/shared';

export type Actions =
    | ConnectionActions
    | CacheActions
    | AccountsActions
    | UserDbActions
    | UiStateActions
    | AuthStateActions;

export const GlobalContext = React.createContext<{
    state: GlobalState;
    dispatch: Dispatch<Actions>;
}>({ state: initialState, dispatch: () => null });

interface GlobalContextProviderProps {
    children: JSX.Element;
}

const mainReducer = (state: GlobalState, action: Actions): GlobalState => ({
    connection: connectionReducer(
        state.connection,
        action as ConnectionActions,
    ),
    cache: cacheReducer(state.cache, action as CacheActions),
    accounts: accountsReducer(state.accounts, action as AccountsActions),
    userDb: userDbReducer(state.userDb, action as UserDbActions),
    uiState: uiStateReducer(state.uiState, action as UiStateActions),
    auth: authReducer(state.auth, action as AuthStateActions),
});

function GlobalContextProvider(props: GlobalContextProviderProps) {
    const [state, dispatch] = React.useReducer(mainReducer, initialState);

    return (
        <GlobalContext.Provider value={{ state, dispatch }}>
            {props.children}
        </GlobalContext.Provider>
    );
}

export default GlobalContextProvider;
