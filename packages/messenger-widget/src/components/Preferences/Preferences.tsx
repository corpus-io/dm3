import './Preferences.css';
import { preferencesItems } from './bl';
import infoIcon from './../../assets/images/preferences-info.svg';
import backIcon from './../../assets/images/back.svg';
import { useContext, useState } from 'react';
import { GlobalContext } from '../../utils/context-utils';
import closeIcon from '../../assets/images/cross.svg';
import { ModalStateType } from '../../utils/enum-type-utils';

export function Preferences() {
    const { dispatch } = useContext(GlobalContext);

    const [optionChoosen, setOptionChoosen] = useState<any>(null);

    return (
        <div>
            <div
                id="preferences-modal"
                className="modal-container position-fixed w-100 h-100"
            >
                <div
                    className="preferences-modal-content border-radius-6 
            background-chat text-primary-color"
                >
                    <div className="row m-0 h-100 w-100">
                        <div className="col-2 m-0 p-0 preferences-aside-content border-radius-6">
                            <div
                                className={'pt-3 d-flex align-items-center'.concat(
                                    ' ',
                                    optionChoosen
                                        ? ''
                                        : 'justify-content-center',
                                )}
                            >
                                {optionChoosen && (
                                    <span>
                                        <img
                                            className="back-icon pointer-cursor"
                                            src={backIcon}
                                            alt="back"
                                            onClick={() =>
                                                setOptionChoosen(null)
                                            }
                                        />
                                    </span>
                                )}
                                <span
                                    className={'preferences-heading d-flex justify-content-center mb-0'.concat(
                                        ' ',
                                        optionChoosen
                                            ? 'preferences-text-highlighted'
                                            : 'text-primary-color',
                                    )}
                                >
                                    Preferences
                                </span>
                            </div>

                            <hr className="preferences-separator" />
                            {preferencesItems.map((item, index) => {
                                return (
                                    <div
                                        className={'target d-flex preferences-item '.concat(
                                            ' ',
                                            optionChoosen &&
                                                optionChoosen.name === item.name
                                                ? 'normal-btn-hover'
                                                : '',
                                        )}
                                        key={index}
                                        onClick={() => setOptionChoosen(item)}
                                    >
                                        {item.image}
                                        {item.name}
                                    </div>
                                );
                            })}

                            <div className="d-flex text-primary-color preferences-info">
                                <span className="d-flex pointer-cursor">
                                    <img
                                        src={infoIcon}
                                        alt="info"
                                        className="me-2"
                                    />
                                    Information
                                </span>
                            </div>
                        </div>
                        <div className="col-10 m-0 p-0">
                            {optionChoosen && optionChoosen.isEnabled ? (
                                optionChoosen.component
                            ) : (
                                <div className="d-flex align-items-start justify-content-end">
                                    <img
                                        className="close-modal-icon m-2"
                                        src={closeIcon}
                                        alt="close"
                                        onClick={() =>
                                            dispatch({
                                                type: ModalStateType.ShowPreferencesModal,
                                                payload: false,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
