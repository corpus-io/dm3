import React from 'react';
import {
    MSG_VIEW_OPTIONS,
    MsgViewOptionType,
    useSettings,
} from '../hooks/settings/useSettings';

export type SettingsContextType = {
    msgViewOptions: MsgViewOptionType[];
    updateMsgView: (msgView: MsgViewOptionType) => void;
    msgViewSelected: MsgViewOptionType;
};

export const SettingsContext = React.createContext<SettingsContextType>({
    msgViewOptions: MSG_VIEW_OPTIONS,
    updateMsgView: (msgView: MsgViewOptionType) => {},
    msgViewSelected: MSG_VIEW_OPTIONS[0],
});

export const SettingsContextProvider = ({ children }: { children?: any }) => {
    const { msgViewOptions, updateMsgView, msgViewSelected } = useSettings();

    return (
        <SettingsContext.Provider
            value={{
                msgViewOptions,
                updateMsgView,
                msgViewSelected,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};
