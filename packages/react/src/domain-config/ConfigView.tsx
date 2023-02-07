import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../GlobalContextProvider';
import * as Lib from 'dm3-lib';
import { ConnectionType } from '../reducers/Connection';

function ConfigView() {
    const [addrEnsName, setAddrEnsName] = useState<string | undefined>();
    const [dm3UserEnsName, setDm3UserEnsName] = useState<string | undefined>();

    const { state, dispatch } = useContext(GlobalContext);

    const getAddrEnsName = async () => {
        if (state.connection.ethAddress && state.connection.provider) {
            const address = await state.connection.provider.resolveName(
                state.connection.ethAddress +
                    Lib.GlobalConf.ADDR_ENS_SUBDOMAIN(),
            );

            if (
                address &&
                Lib.external.formatAddress(address) ===
                    Lib.external.formatAddress(state.connection.ethAddress)
            ) {
                setAddrEnsName(
                    state.connection.ethAddress +
                        Lib.GlobalConf.ADDR_ENS_SUBDOMAIN(),
                );
            }
        }
    };

    const submitDm3UsernameClaim = async () => {
        const signedProfile = await Lib.account.getUserProfile(
            state.connection,
            state.connection.account!.ensName,
        );

        await Lib.external.claimSubdomain(
            state.connection.account!,
            'http://localhost:8081/profile',
            dm3UserEnsName! + Lib.GlobalConf.USER_ENS_SUBDOMAIN(),
            signedProfile!,
        );

        await Lib.external.createAlias(
            state.connection.account!,
            state.connection,
            state.connection.account!.ensName,
            dm3UserEnsName! + Lib.GlobalConf.USER_ENS_SUBDOMAIN(),
            state.auth.currentSession!.token!,
        );

        dispatch({
            type: ConnectionType.ChangeAccount,
            payload: {
                ...state.connection.account!,
                ensName: dm3UserEnsName + Lib.GlobalConf.USER_ENS_SUBDOMAIN(),
            },
        });
        window.location.reload();
    };

    useEffect(() => {
        getAddrEnsName();
    }, [state.connection.ethAddress, state.connection.provider]);

    return (
        <div className="user-info">
            <div className="row">
                <div className="col">
                    <div className="input-group mb-3">
                        <div className="input-group-text">
                            <input
                                className="form-check-input mt-0"
                                type="checkbox"
                                value=""
                                aria-label="Checkbox for following text input"
                                checked
                                disabled
                            />
                        </div>
                        <input
                            type="text"
                            value={addrEnsName}
                            className="form-control"
                            aria-label="Text input with checkbox"
                            disabled
                        />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <div className="input-group mb-3">
                        <div className="input-group-text">
                            <input
                                className="form-check-input mt-0"
                                type="checkbox"
                                value=""
                                aria-label="Checkbox for following text input"
                            />
                        </div>
                        <input
                            type="text"
                            onInput={(
                                event: React.FormEvent<HTMLInputElement>,
                            ) => {
                                setDm3UserEnsName((event.target as any).value);
                            }}
                            className="form-control"
                            aria-label="Text input with checkbox"
                        />
                        <span className="input-group-text">
                            Lib.GlobalConf.USER_ENS_SUBDOMAIN()
                        </span>
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={submitDm3UsernameClaim}
                        >
                            Claim
                        </button>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <div className="input-group mb-3">
                        <div className="input-group-text">
                            <input
                                className="form-check-input mt-0"
                                type="checkbox"
                                value=""
                                aria-label="Checkbox for following text input"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="ENS domain"
                            className="form-control"
                            aria-label="Text input with checkbox"
                        />

                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                        >
                            Publish Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfigView;
