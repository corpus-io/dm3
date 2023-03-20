import React, { useContext } from 'react';
import Icon from '../ui-shared/Icon';
import * as Lib from 'dm3-lib';
import { GlobalContext } from '../GlobalContextProvider';
import Avatar from '../ui-shared/Avatar';
import { AccountsType } from '../reducers/Accounts';
import { AccountInfo } from '../reducers/shared';
import { SelectedRightView, UiStateType } from '../reducers/UiState';
import './Chat.css';

interface ChatHeaderProps {
    account: Lib.account.Account | undefined;
}

function ChatHeader(props: ChatHeaderProps) {
    const { state, dispatch } = useContext(GlobalContext);

    if (state.accounts.accountInfoView !== AccountInfo.None) {
        let headerText = '';

        switch (state.accounts.accountInfoView) {
            case AccountInfo.Contact:
                headerText = props.account
                    ? Lib.account.getAccountDisplayName(
                          props.account.ensName,
                          35,
                      )
                    : '';
                break;

            case AccountInfo.DomainConfig:
                headerText = 'Domain Config';
                break;

            default:
                headerText = 'Account Info';
                break;
        }

        return (
            <div
                className={
                    ' ps-3 account-name w-100 d-flex justify-content-between' +
                    ' account-header h-100 d-flex flex-column pe-3'
                }
            >
                <div className="w-100 mt-3 mb-3">
                    <div className="w-100">
                        <div className=" d-flex justify-content-between  pe-0">
                            <div className="push-end d-flex">
                                <button
                                    type="button"
                                    className={
                                        `right-btn btn btn-outline-secondary` +
                                        ` w-100 show-add-btn align-self-center`
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch({
                                            type: UiStateType.SetMaxLeftView,
                                            payload: !state.uiState.maxLeftView,
                                        });
                                    }}
                                >
                                    {state.uiState.maxLeftView ? (
                                        <Icon iconClass="fas fa-expand" />
                                    ) : (
                                        <Icon iconClass="far fa-window-maximize fa-rotate-270" />
                                    )}
                                </button>
                            </div>
                            <div className="d-flex">
                                <div className="account-header-text align-self-center">
                                    {headerText}
                                </div>
                            </div>

                            <div className="d-flex align-items-center">
                                <button
                                    type="button"
                                    className={
                                        `right-btn btn btn-outline-secondary` +
                                        ` w-100 show-add-btn align-self-center`
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch({
                                            type: UiStateType.SetSelectedRightView,
                                            payload: SelectedRightView.Chat,
                                        });
                                        dispatch({
                                            type: AccountsType.SetAccountInfoView,
                                            payload: AccountInfo.None,
                                        });
                                        if (!state.accounts.selectedContact) {
                                            dispatch({
                                                type: UiStateType.SetMaxLeftView,
                                                payload: true,
                                            });
                                        }
                                    }}
                                >
                                    <Icon iconClass="fas fa-times fa-lg" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (props.account) {
        return (
            <div
                className={
                    ' ps-3  account-name w-100 d-flex justify-content-between' +
                    ' account-header h-100 d-flex flex-column pe-3'
                }
            >
                <div className="w-100 mt-3 mb-3">
                    <div className="w-100">
                        <div className=" d-flex justify-content-between  pe-0">
                            <div className="push-end d-flex">
                                <button
                                    type="button"
                                    className={
                                        `right-btn btn btn-outline-secondary w-100` +
                                        ` show-add-btn align-self-center`
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch({
                                            type: UiStateType.SetMaxLeftView,
                                            payload: !state.uiState.maxLeftView,
                                        });
                                    }}
                                >
                                    {state.uiState.maxLeftView ? (
                                        <Icon iconClass="fas fa-expand" />
                                    ) : (
                                        <Icon iconClass="far fa-window-maximize fa-rotate-270" />
                                    )}
                                </button>
                            </div>
                            <div className="d-flex">
                                <div
                                    className="account-header-text align-self-center"
                                    onClick={() =>
                                        dispatch({
                                            type: AccountsType.SetAccountInfoView,
                                            payload: AccountInfo.Contact,
                                        })
                                    }
                                >
                                    {Lib.account.getAccountDisplayName(
                                        props.account.ensName,
                                        35,
                                    )}
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="d-flex contact-entry-avatar">
                                    <Avatar ensName={props.account.ensName} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return null;
    }
}

export default ChatHeader;
