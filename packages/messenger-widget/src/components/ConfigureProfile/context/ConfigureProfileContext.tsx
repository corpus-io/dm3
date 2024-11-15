import React, { useContext, useEffect, useState } from 'react';
import { NAME_TYPE } from '../chain/common';
import { dm3NamingServices, namingServices } from '../bl';
import { AuthContext } from '../../../context/AuthContext';
import { DM3ConfigurationContext } from '../../../context/DM3ConfigurationContext';
import { ModalContext } from '../../../context/ModalContext';

export interface ConfigureProfileContextType {
    existingEnsName: string | null;
    setExistingEnsName: (name: string | null) => void;
    errorMsg: string;
    showError: NAME_TYPE | undefined;
    onShowError: (type: NAME_TYPE | undefined, msg: string) => void;
    ensName: string;
    setEnsName: (name: string) => void;
    dm3NameServiceSelected: string;
    setDm3NameServiceSelected: (serviceName: string) => void;
    namingServiceSelected: string;
    setNamingServiceSelected: (serviceName: string) => void;
}

export const ConfigureProfileContext =
    React.createContext<ConfigureProfileContextType>({
        existingEnsName: '',
        setExistingEnsName: (name: string | null) => {},
        errorMsg: '',
        showError: undefined,
        onShowError: (type: NAME_TYPE | undefined, msg: string) => {},
        ensName: '',
        setEnsName: (name: string) => {},
        dm3NameServiceSelected: '',
        setDm3NameServiceSelected: (serviceName: string) => {},
        namingServiceSelected: '',
        setNamingServiceSelected: (serviceName: string) => {},
    });

export const ConfigureProfileContextProvider = (props: { children?: any }) => {
    const [ensName, setEnsName] = useState<string>('');
    // error states
    const [showError, setShowError] = useState<NAME_TYPE | undefined>(
        undefined,
    );
    const [existingEnsName, setExistingEnsName] = useState<string | null>(null);

    const [errorMsg, setErrorMsg] = useState<string>('');

    const { disabledOptions } = useContext(ModalContext);

    // DM3 Name service selected
    // By default, first DM3 name is set from the dropdown which is not disabled
    const [dm3NameServiceSelected, setDm3NameServiceSelected] =
        useState<string>(
            dm3NamingServices.filter(
                (d) =>
                    disabledOptions.profile.dm3.filter(
                        (p) => p.key === d.key && !p.value,
                    ).length,
            )[0]?.name,
        );

    // ENS Name service selected
    // By default, first ENS name is set from the dropdown which is not disabled
    const [namingServiceSelected, setNamingServiceSelected] = useState<string>(
        namingServices.filter(
            (n) =>
                disabledOptions.profile.own.filter(
                    (p) => p.key === n.key && !p.value,
                ).length,
        )[0]?.name,
    );

    const { displayName } = useContext(AuthContext);
    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    useEffect(() => {
        setExistingEnsName(
            displayName
                ? !displayName.endsWith(dm3Configuration.addressEnsSubdomain) &&
                  !displayName.endsWith(dm3Configuration.userEnsSubdomain) &&
                  !displayName.endsWith('.op.dm3.eth')
                    ? displayName
                    : null
                : null,
        );
    }, []);

    return (
        <ConfigureProfileContext.Provider
            value={{
                existingEnsName: existingEnsName,
                setExistingEnsName,
                errorMsg: errorMsg,
                showError: showError,
                onShowError: (type: NAME_TYPE | undefined, msg: string) => {
                    setShowError(type);
                    setErrorMsg(msg);
                },
                ensName: ensName,
                setEnsName: setEnsName,
                dm3NameServiceSelected: dm3NameServiceSelected,
                setDm3NameServiceSelected: setDm3NameServiceSelected,
                namingServiceSelected: namingServiceSelected,
                setNamingServiceSelected: setNamingServiceSelected,
            }}
        >
            {props.children}
        </ConfigureProfileContext.Provider>
    );
};
