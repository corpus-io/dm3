import { Account, ProfileKeys } from '@dm3-org/dm3-lib-profile';
import React from 'react';
import { useAuth } from '../hooks/auth/useAuth';

export type AuthContextType = {
    cleanSignIn: () => Promise<void>;
    luksoSignIn: () => Promise<void>;
    siweSignIn: () => Promise<void>;
    setDisplayName: Function;
    account: Account | undefined;
    displayName: string | undefined;
    isProfileReady: boolean;
    isLoading: boolean;
    hasError: boolean;
    ethAddress: string | undefined;
    profileKeys: ProfileKeys | undefined;
};

export const AuthContext = React.createContext<AuthContextType>({
    cleanSignIn: () => Promise.resolve(),
    luksoSignIn: () => Promise.resolve(),
    siweSignIn: () => Promise.resolve(),
    setDisplayName: () => {},
    account: undefined,
    displayName: undefined,
    isProfileReady: false,
    isLoading: false,
    hasError: false,
    ethAddress: undefined,
    profileKeys: undefined,
});

export const AuthContextProvider = ({ children }: { children?: any }) => {
    const {
        cleanSignIn,
        luksoSignIn,
        siweSignIn,
        setDisplayName,
        account,
        displayName,
        isProfileReady,
        isLoading,
        hasError,
        ethAddress,
        profileKeys,
    } = useAuth();
    return (
        <AuthContext.Provider
            value={{
                cleanSignIn,
                siweSignIn,
                luksoSignIn,
                setDisplayName,
                account,
                displayName,
                isProfileReady,
                isLoading,
                hasError,
                ethAddress,
                profileKeys,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
