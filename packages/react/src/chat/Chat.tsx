import * as Lib from 'dm3-lib';
import { useContext, useEffect, useState } from 'react';
import {
    addResponseMessage,
    addUserMessage,
    deleteMessages,
    dropMessages,
    isWidgetOpened,
    renderCustomComponent,
    toggleWidget,
    Widget,
} from 'react-chat-widget';
import MessageStateView from './MessageStateView';
import './Chat.css';
import { GlobalContext } from '../GlobalContextProvider';
import { UiStateType } from '../reducers/UiState';
import { UserDbType } from '../reducers/UserDB';
import './Chat.css';
import InfoBox from './InfoBox';
import StorageView from '../storage/StorageView';
import { checkSignature } from '../utils/SigCheck';
import { MessageContext } from '../../context/messageContext/MessageContext';

export interface EnvelopContainer {
    envelop: Lib.messaging.Envelop;
    encrypted: boolean;
}

function Chat() {
    const { state, dispatch } = useContext(GlobalContext);
    const { submitMessage, fetchAndStoreMessages } = useContext(MessageContext);

    const alias =
        state.connection.ethAddress &&
        state.connection.ethAddress + Lib.GlobalConf.ADDR_ENS_SUBDOMAIN();

    if (!isWidgetOpened()) {
        toggleWidget();
    }
    const [messageStates, setMessageStates] = useState<
        Map<string, Lib.messaging.MessageState>
    >(new Map<string, Lib.messaging.MessageState>());

    const addAlert = () => {
        if (
            !state.accounts.selectedContact?.account.profile
                ?.publicEncryptionKey
        ) {
            renderCustomComponent(
                () => (
                    <InfoBox
                        text={`This user hasn't created a dm3 profile yet.`}
                    />
                ),
                {},
            );
        }
    };

    const handleMessageContainer = (
        messageContainers: Lib.storage.StorageEnvelopContainer[],
    ) => {
        dropMessages();
        addAlert();
        messageContainers.forEach((container) => {
            if (
                Lib.profile.isSameEnsName(
                    container.envelop.message.metadata.from,
                    state.connection.account!.ensName,
                    alias,
                )
            ) {
                addUserMessage(
                    container.envelop.message.message,
                    container.envelop.message.metadata.timestamp.toString(),
                );
            } else {
                addResponseMessage(
                    container.envelop.message.message,
                    container.envelop.message.metadata.timestamp.toString(),
                );
            }

            messageStates.set(
                container.envelop.message.metadata.timestamp.toString(),
                container.messageState,
            );
            setMessageStates(new Map(messageStates));
            renderCustomComponent(
                () => (
                    <MessageStateView
                        messageState={
                            messageStates.get(
                                container.envelop.message.metadata.timestamp.toString(),
                            ) as Lib.messaging.MessageState
                        }
                        time={container.envelop.message.metadata.timestamp}
                        ownMessage={Lib.profile.isSameEnsName(
                            container.envelop.message.metadata.from,
                            state.connection.account!.ensName,
                            alias,
                        )}
                    />
                ),
                {},
            );
        });
    };

    const handleMessages = (
        containers: Lib.storage.StorageEnvelopContainer[],
    ): void => {
        const checkedContainers = containers.filter((container) => {
            if (!state.accounts.selectedContact) {
                throw Error('No selected contact');
            }

            const account = Lib.profile.isSameEnsName(
                container.envelop.message.metadata.from,
                state.accounts.selectedContact.account.ensName,
                alias,
            )
                ? state.accounts.selectedContact.account
                : state.connection.account!;

            return account.profile?.publicSigningKey
                ? checkSignature(
                      container.envelop.message,
                      account.profile?.publicSigningKey,
                      account.ensName,
                      container.envelop.message.signature,
                  )
                : true;
        });

        const newMessages = checkedContainers
            .filter(
                (conatier) =>
                    conatier.messageState === Lib.messaging.MessageState.Send,
            )
            .map((container) => ({
                ...container,
                messageState: Lib.messaging.MessageState.Read,
            }));

        const oldMessages = checkedContainers.filter(
            (conatier) =>
                conatier.messageState === Lib.messaging.MessageState.Read ||
                conatier.messageState === Lib.messaging.MessageState.Created,
        );

        handleMessageContainer(oldMessages);

        if (!state.userDb) {
            throw Error(
                `[handleMessages] Couldn't handle new messages. User db not created.`,
            );
        }

        if (newMessages.length > 0) {
            newMessages.forEach((message) =>
                dispatch({
                    type: UserDbType.addMessage,
                    payload: {
                        container: message,
                        connection: state.connection,
                    },
                }),
            );
        }
    };

    useEffect(() => {
        let ignore = false;
        dropMessages();
        addAlert();

        const getPastMessages = async () => {
            const lastMessagePull = new Date().getTime();
            if (!state.accounts.selectedContact) {
                throw Error('no contact selected');
            }
            const messages = await fetchAndStoreMessages(
                state.connection,
                state.auth.currentSession?.token!,
                state.accounts.selectedContact.account.ensName,
                state.userDb as Lib.storage.UserDB,
                (envelops) => {
                    if (!ignore) {
                        envelops.forEach((envelop) =>
                            dispatch({
                                type: UserDbType.addMessage,
                                payload: {
                                    container: envelop,
                                    connection: state.connection,
                                },
                            }),
                        );
                    }
                },
                state.accounts.contacts.map((contact) => contact.account),
            );

            if (!ignore && messages.length > 0) {
                handleMessages(messages);
                setMessageStates(new Map<string, Lib.messaging.MessageState>());
                dispatch({
                    type: UiStateType.SetLastMessagePull,
                    payload: lastMessagePull,
                });
            }
        };

        if (!ignore && state.accounts.selectedContact) {
            getPastMessages();
        }

        return () => {
            ignore = true;
        };
    }, [state.accounts.selectedContact]);

    useEffect(() => {
        if (
            state.accounts.selectedContact &&
            state.userDb &&
            state.accounts.contacts
        ) {
            handleMessages(
                Lib.storage.getConversation(
                    state.accounts.selectedContact.account.ensName,
                    state.accounts.contacts.map((contact) => contact.account),
                    state.userDb,
                ),
            );
        }
    }, [
        state.userDb?.conversations,
        state.accounts.selectedContact,
        state.accounts.contacts,
    ]);

    const handleNewUserMessage = async (
        message: string,
        userDb: Lib.storage.UserDB,
    ) => {
        deleteMessages(1);

        if (!state.accounts.selectedContact) {
            throw Error('no contact selected');
        }

        // if (!state.accounts.selectedContact.deliveryServiceProfile) {
        //     throw Error('no deliveryServiceProfile');
        // }

        const haltDelivery =
            state.accounts.selectedContact?.account.profile
                ?.publicEncryptionKey &&
            state.connection.account?.profile?.publicEncryptionKey
                ? false
                : true;

        const messageData = await Lib.messaging.createMessage(
            state.accounts.selectedContact.account.ensName,
            state.connection.account!.ensName,
            message,
            userDb.keys.encryptionKeyPair.privateKey,
        );
        const messageId = messageData.metadata.timestamp.toString();
        messageStates.set(messageId, Lib.messaging.MessageState.Created);
        setMessageStates(new Map(messageStates));

        const sendDependencies: Lib.messaging.SendDependencies = {
            deliveryServiceEncryptionPubKey:
                state.accounts.selectedContact.deliveryServiceProfile
                    ?.publicEncryptionKey ?? '',
            from: state.connection.account!,
            to: state.accounts.selectedContact.account,
            keys: userDb.keys,
        };

        try {
            await submitMessage(
                state.connection,
                state.auth.currentSession?.token!,
                sendDependencies,
                messageData,
                haltDelivery,
                (envelops: Lib.storage.StorageEnvelopContainer[]) =>
                    envelops.forEach((envelop) =>
                        dispatch({
                            type: UserDbType.addMessage,
                            payload: {
                                container: envelop,
                                connection: state.connection,
                            },
                        }),
                    ),

                () => {
                    messageStates.set(
                        messageId,
                        Lib.messaging.MessageState.Send,
                    );
                    setMessageStates(new Map(messageStates));
                },
            );
        } catch (e) {
            Lib.log(e as string);
            messageStates.set(
                messageId,
                Lib.messaging.MessageState.FailedToSend,
            );
            setMessageStates(new Map(messageStates));
        }
    };

    const widget = (
        <Widget
            emojis={false}
            launcher={() => null}
            handleNewUserMessage={(message: string) =>
                handleNewUserMessage(
                    message,
                    state.userDb as Lib.storage.UserDB,
                )
            }
            key={state.accounts.selectedContact?.account.ensName}
            showTimeStamp={false}
        />
    );

    return (
        <div className="widget-container flex-grow-1">
            <div className="h-100">
                {/* @ts-ignore */}
                {widget}
                {!state.uiState.maxLeftView && <StorageView />}
            </div>
        </div>
    );
}

export default Chat;
