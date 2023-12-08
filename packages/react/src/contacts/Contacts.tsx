import { useContext, useEffect } from 'react';
import { GlobalContext } from '../GlobalContextProvider';
import { Connection, ConnectionState } from '../web3provider/Web3Provider';
import AddContactForm from './AddContactForm';
import ContactList from './ContactList';
import './Contacts.css';

interface ContactsProps {
    getContacts: (connection: Connection) => Promise<void>;
}

function Contacts(props: ContactsProps) {
    const { state, dispatch } = useContext(GlobalContext);
    useEffect(() => {
        if (
            !state.accounts.contacts &&
            state.auth?.currentSession?.token &&
            state.connection.socket
        ) {
            props.getContacts(state.connection);
        }
    }, [state.auth?.currentSession?.token, state.connection.socket]);

    useEffect(() => {
        if (state.userDb?.conversations && state.userDb?.conversationsCount) {
            props.getContacts(state.connection);
        }
    }, [state.userDb?.conversations, state.userDb?.conversationsCount]);

    return (
        <div className="w-100 flex-grow-1 contacts overflow-overlay">
            <div className="text-center contact-list-container">
                <AddContactForm getContacts={props.getContacts} />
            </div>

            {state.accounts.contacts &&
                state.connection.connectionState ===
                    ConnectionState.SignedIn && (
                    <div className="text-center contact-list-container">
                        <ContactList />
                    </div>
                )}
        </div>
    );
}

export default Contacts;
