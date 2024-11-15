import { ethers } from 'ethers';
import { FormEvent, useContext, useState } from 'react';
import closeIcon from '../../assets/images/cross.svg';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { ModalContext } from '../../context/ModalContext';
import { TLDContext } from '../../context/TLDContext';
import { UiViewContext } from '../../context/UiViewContext';
import '../../styles/modal.css';
import {
    LeftViewSelected,
    RightViewSelected,
} from '../../utils/enum-type-utils';
import { closeLoader, startLoader } from '../Loader/Loader';
import './AddConversation.css';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';

// class for input field
export const INPUT_FIELD_CLASS =
    'conversation-name font-weight-400 border-radius-6 w-100 line-height-24';

export default function AddConversation() {
    const { addConversation, setSelectedContactName } =
        useContext(ConversationContext);
    const { ethAddress } = useContext(AuthContext);
    const { setSelectedLeftView, setSelectedRightView } =
        useContext(UiViewContext);
    const {
        setShowAddConversationModal,
        setLoaderContent,
        setAddConversation,
    } = useContext(ModalContext);

    const [tldName, setTldName] = useState<string>('');
    const [showError, setShowError] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [inputClass, setInputClass] = useState<string>(INPUT_FIELD_CLASS);

    // handles new contact submission
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTldName(tldName.trim());
        if (tldName.length) {
            // start loader
            setLoaderContent('Adding contact...');
            startLoader();

            const ensNameIsInvalid =
                ethAddress &&
                tldName.split('.')[0] &&
                ethAddress.toLowerCase() ===
                    tldName.split('.')[0].toLowerCase();

            if (ensNameIsInvalid) {
                setErrorMsg('Please enter valid ENS name');
                setShowError(true);
                return;
            }

            const normalizedEnsName = normalizeEnsName(tldName);
            const newContact = await addConversation(normalizedEnsName);

            const addConversationData = {
                active: true,
                ensName: newContact?.contactDetails.account.ensName,
                processed: false,
            };

            // set new contact data
            setAddConversation(addConversationData);

            // set left view to contacts
            setSelectedLeftView(LeftViewSelected.Contacts);

            // set right view to chat
            setSelectedRightView(RightViewSelected.Chat);
            if (!newContact) {
                //Maybe show a message that its not possible to add the users address as a contact
                setShowAddConversationModal(false);
                closeLoader();
                return;
            }
            setSelectedContactName(newContact.contactDetails.account.ensName);
            closeLoader();

            // close the modal
            setShowAddConversationModal(false);
        } else {
            setErrorMsg('Please enter valid ENS name');
            setShowError(true);
        }
    };

    // handles name change event
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg('');
        setShowError(false);
        setTldName(e.target.value);

        if (
            !(
                ethers.utils.isValidName(e.target.value) ||
                isLuksoName(e.target.value)
            )
        ) {
            setErrorMsg('Invalid address or ENS name');
            setShowError(true);
        }
    };

    const isLuksoName = (input: string): boolean => {
        const regex = /^[a-zA-Z0-9]+#[a-zA-Z0-9]{4}\.up$/;
        return regex.test(input);
    };

    return (
        <div>
            <div
                id="conversation-modal"
                className="modal-container position-fixed w-100 h-100"
            >
                <div
                    className="conversation-modal-content border-radius-6 
                background-container text-primary-color"
                >
                    <div className="d-flex align-items-start">
                        <div className="width-fill">
                            <h4 className="font-weight-800 mb-1">
                                Add Conversation
                            </h4>
                            <div className="font-weight-500 font-size-12">
                                Add or reactivate a conversation with a web3
                                name.
                            </div>
                        </div>
                        <img
                            className="close-modal-icon"
                            src={closeIcon}
                            alt="close"
                            onClick={() => setShowAddConversationModal(false)}
                        />
                    </div>

                    <hr className="line-separator separator text-secondary-color" />

                    <form
                        aria-label="add-conv-form"
                        onSubmit={(e: React.FormEvent) => submit(e)}
                        className="mt-4 mb-2 d-flex"
                    >
                        <div className="pe-3">
                            <div className="d-flex align-items-center">
                                <label
                                    htmlFor="name"
                                    className="font-size-14 font-weight-500 invisible"
                                >
                                    Name
                                </label>
                                <div
                                    className={'conversation-error font-weight-400'.concat(
                                        ' ',
                                        showError ? 'show-error' : 'hide-error',
                                    )}
                                >
                                    {errorMsg}
                                </div>
                            </div>
                            <div className="d-flex add-name-container">
                                <label
                                    title="add-conv-label"
                                    htmlFor="name"
                                    className="font-size-14 font-weight-500"
                                >
                                    Name
                                </label>
                                <input
                                    data-testid="add-conv-input"
                                    id="add-conv-input"
                                    className={inputClass.concat(
                                        ' ',
                                        showError ? 'err-background' : '',
                                    )}
                                    type="text"
                                    placeholder="Enter the name or address of the contact"
                                    value={tldName}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => handleNameChange(e)}
                                />
                            </div>

                            <p className="conversation-description font-weight-300">
                                Enter the web3 name or the address (the reverse
                                lookup should be configured) of the contact you
                                want to start a conversation. If the recipient
                                has not yet published his/her dm3 profile,
                                messages will be stored and sent later.
                            </p>
                        </div>
                        <div>
                            <button
                                disabled={
                                    !tldName || !tldName.length || showError
                                }
                                className={'add-btn font-weight-400 font-size-12 border-radius-4 line-height-24'.concat(
                                    ' ',
                                    !tldName || !tldName.length || showError
                                        ? 'modal-btn-disabled'
                                        : 'modal-btn-active',
                                )}
                                onClick={(e: FormEvent) => submit(e)}
                            >
                                Add
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
