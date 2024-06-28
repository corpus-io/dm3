import './Chat.css';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { MessageContext } from '../../context/MessageContext';
import { MessageModel } from '../../hooks/messages/useMessage';
import { MOBILE_SCREEN_WIDTH } from '../../utils/common-utils';
import { MessageActionType } from '../../utils/enum-type-utils';
import ConfigProfileAlertBox from '../ContactProfileAlertBox/ContactProfileAlertBox';
import { Message } from '../Message/Message';
import { MessageInputBox } from '../MessageInputBox/MessageInputBox';
import { scrollToBottomOfChat } from './scrollToBottomOfChat';
import { ModalContext } from '../../context/ModalContext';
import InfiniteScroll from 'react-infinite-scroll-component';

export function Chat() {
    const { account } = useContext(AuthContext);
    const { selectedContact, contacts, setSelectedContactName } =
        useContext(ConversationContext);
    const { screenWidth, dm3Configuration } = useContext(
        DM3ConfigurationContext,
    );
    const { getMessages, contactIsLoading, loadMoreMessages } =
        useContext(MessageContext);
    const { lastMessageAction } = useContext(ModalContext);

    const [isProfileConfigured, setIsProfileConfigured] =
        useState<boolean>(false);
    const [showShimEffect, setShowShimEffect] = useState(false);

    useEffect(() => {
        if (!selectedContact) {
            return;
        }
        setIsProfileConfigured(
            !!selectedContact?.contactDetails.account.profile,
        );
    }, [selectedContact]);

    const messages = useMemo(() => {
        if (!selectedContact) {
            return [];
        }
        return getMessages(selectedContact.contactDetails.account.ensName!);
    }, [getMessages, selectedContact]);

    // handles messages list
    useEffect(() => {
        const isLoading = contactIsLoading(
            selectedContact?.contactDetails.account.ensName!,
        );
        setShowShimEffect(isLoading);
    }, [contactIsLoading]);

    // scrolls to bottom of chat when messages are loaded
    useEffect(() => {
        if (messages.length && lastMessageAction === MessageActionType.NONE) {
            scrollToBottomOfChat();
        }
        console.log(messages);
    }, [messages]);

    /**
     *  Load's default contact chat when contact list is not enabled
     **/
    useEffect(() => {
        if (!dm3Configuration.showContacts) {
            // set the default contact
            setSelectedContactName(dm3Configuration.defaultContact);

            // filter out the default contact from contact list
            const defContact = contacts.filter(
                (data) => data.name === dm3Configuration.defaultContact,
            );

            if (defContact.length) {
                // set the contact by its ensName found in contact list
                setSelectedContactName(
                    defContact[0].contactDetails.account.ensName,
                );
            }
        }
    }, []);

    /* shimmer effect contacts css */
    const shimmerData: number[] = Array.from({ length: 50 }, (_, i) => i + 1);

    return (
        <div
            id="chat-msgs"
            className={'chat-msgs width-fill '
                .concat(
                    selectedContact && screenWidth >= MOBILE_SCREEN_WIDTH
                        ? 'highlight-chat-border'
                        : 'highlight-chat-border-none',
                )
                .concat(
                    ' ',
                    !dm3Configuration.showContacts ? ' ps-2 pe-2' : '',
                )}
        >
            {/* Shimmer effect while messages are loading */}
            {showShimEffect && (
                <div
                    id="chat-box"
                    className={
                        'chat-items position-relative mb-2 skeletion-chat-height'
                    }
                >
                    {shimmerData.map((item, index) => {
                        return (
                            <span
                                key={index}
                                className={'text-primary-color d-grid msg'.concat(
                                    ' ',
                                    index % 2
                                        ? 'me-2 justify-content-end'
                                        : 'ms-2 justify-content-start',
                                )}
                            >
                                <div className="d-flex">
                                    <div
                                        className="width-fill text-left font-size-14 border-radius-6 content-style 
                                        ms-3 background-config-box skeleton-message"
                                    ></div>
                                </div>
                            </span>
                        );
                    })}
                </div>
            )}

            {!showShimEffect && (
                <>
                    {/* To show information box that contact has not created profile */}
                    {!isProfileConfigured && <ConfigProfileAlertBox />}

                    {/* Chat messages */}
                    <div
                        id="chat-box"
                        className={'chat-items mb-2'.concat(
                            ' ',
                            !isProfileConfigured
                                ? 'chat-height-small'
                                : 'chat-height-high',
                        )}
                        style={{
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column-reverse',
                        }}
                    >
                        <InfiniteScroll
                            dataLength={messages.length}
                            next={() =>
                                loadMoreMessages(
                                    selectedContact?.contactDetails.account
                                        .ensName!,
                                )
                            }
                            style={{
                                display: 'flex',
                                flexDirection: 'column-reverse',
                            }} //To put endMessage and loader to the top.
                            inverse={true}
                            hasMore={true}
                            loader={
                                <h4
                                    style={{
                                        fontSize: '14px',
                                        textAlign: 'center',
                                        color: 'white',
                                    }}
                                >
                                    Loading old messages...
                                </h4>
                            }
                            scrollableTarget="chat-box"
                        >
                            {messages.length > 0 &&
                                messages.map(
                                    (
                                        storageEnvelopContainer: MessageModel,
                                        index,
                                    ) => (
                                        <div key={index} className="mt-2">
                                            <Message
                                                message={
                                                    storageEnvelopContainer
                                                        .envelop.message
                                                        .message ?? ''
                                                }
                                                time={
                                                    storageEnvelopContainer.envelop.message.metadata?.timestamp.toString() ??
                                                    '0'
                                                }
                                                messageState={
                                                    storageEnvelopContainer.messageState
                                                }
                                                ownMessage={
                                                    storageEnvelopContainer
                                                        .envelop.message
                                                        .metadata?.from ===
                                                    account!.ensName
                                                }
                                                envelop={
                                                    storageEnvelopContainer.envelop
                                                }
                                                reactions={
                                                    storageEnvelopContainer.reactions
                                                }
                                                replyToMessageEnvelop={
                                                    storageEnvelopContainer.replyToMessageEnvelop
                                                }
                                            />
                                        </div>
                                    ),
                                )}
                        </InfiniteScroll>
                    </div>

                    {/* Message, emoji and file attachments */}
                    <MessageInputBox />
                </>
            )}
        </div>
    );
}
