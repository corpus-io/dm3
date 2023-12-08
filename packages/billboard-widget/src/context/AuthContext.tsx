import { ProfileKeys } from 'dm3-lib-profile';
import React, { useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GlobalContext } from './GlobalContext';

export type AuthContextType = {
    profileKeys: ProfileKeys;
    ensName: string;
    initialized: boolean;
};

export const AuthContext = React.createContext<AuthContextType>({
    profileKeys: {} as ProfileKeys,
    ensName: '',
    initialized: false,
});

export const AuthContextProvider = ({ children }: { children?: any }) => {
    const { clientProps, web3Provider } = useContext(GlobalContext);
    const { getWallet } = useAuth(web3Provider, clientProps);

    const [initialized, setInitialized] = useState(false);
    const [initializing, setInitializing] = useState(false);

    const [profileKeys, setprofileKeys] = useState<ProfileKeys>(
        {} as ProfileKeys,
    );
    const [ensName, setEnsName] = useState<string>('');

    useEffect(() => {
        const init = async () => {
            setInitializing(true);
            const { keys, ensName } = await getWallet();
            setInitialized(true);
            setprofileKeys(keys);
            setEnsName(ensName);
            setInitializing(false);
        };

        if (initializing || initialized) {
            return;
        }

        init();
    }, [getWallet, initialized, initializing]);

    return (
        <AuthContext.Provider value={{ profileKeys, ensName, initialized }}>
            {children}
        </AuthContext.Provider>
    );
};
