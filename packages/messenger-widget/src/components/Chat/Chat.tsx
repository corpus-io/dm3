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
import { MessagePropsModel } from '../../interfaces/utils';

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

    // state which tracks old msgs loading is active or not
    const [loadingOldMsgs, setLoadingOldMsgs] = useState(false);

    // state to track more old msgs exists or not
    const [hasMoreOldMsgs, setHasMoreOldMsgs] = useState(true);

    const fetchOldMessages = async () => {
        setLoadingOldMsgs(true);
        const newMsgCount = await loadMoreMessages(
            selectedContact?.contactDetails.account.ensName!,
        );
        // if no old msgs are found, sets state to no more old msgs exists
        if (!newMsgCount) {
            setHasMoreOldMsgs(false);
        }
    };

    // This function adds a property called showProfile which is of type boolean
    // It helps to indicate whether a profile preview has to be shown with message or not
    // It also adds a property isFirstMsgofDay which indicates its a first message of particular day
    const formatMessages = (
        messageList: MessageModel[],
    ): MessagePropsModel[] => {
        // The message list is reversed and then property is added because the pagination library
        // reverses the message list and then it is visible.
        // So to keep profile preview updated list is reversed
        const list = messageList.reverse().map((m, index) => {
            // the sender or current message
            const currentMsgSender = m.envelop.message.metadata?.from;
            // the sender of message before the current message
            const lastMsgSender = index
                ? messageList[index - 1].envelop.message.metadata?.from
                : '';
            // the date on which current message was sent
            const currentMsgDate = new Date(
                Number(m.envelop.message.metadata?.timestamp),
            ).getDate();
            // the date on which last message was sent
            const lastMsgDate = index
                ? new Date(
                      Number(
                          messageList[index - 1].envelop.message.metadata
                              ?.timestamp,
                      ),
                  ).getDate()
                : 0;
            return {
                ...m,
                // if its not a first message and last 2 messages sender is same then no need to show
                // profile for this message otherwise show profile
                showProfile: !(index && currentMsgSender === lastMsgSender),
                // if the index is 0, then its first message of specific date, so set to true
                // otherwise check 2 dates, if they are same then its not first msg else it is first msg of day
                isFirstMsgOfDay: !index ? true : lastMsgDate !== currentMsgDate,
            };
        });

        // after setting the property, the list is returned back in actual order
        return list.reverse();
    };

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
        return formatMessages(
            getMessages(selectedContact.contactDetails.account.ensName!),
        );
    }, [getMessages, selectedContact]);

    // handles messages list
    useEffect(() => {
        const isLoading = contactIsLoading(
            selectedContact?.contactDetails.account.ensName!,
        );

        // shim effect must be visible only if the messages are loaded first time
        if (!messages.length) {
            setShowShimEffect(isLoading);
        }
    }, [contactIsLoading]);

    // scrolls to bottom of chat when messages are loaded
    useEffect(() => {
        // scrolls to bottom only when old msgs are not fetched
        if (
            messages.length &&
            lastMessageAction === MessageActionType.NONE &&
            !loadingOldMsgs
        ) {
            scrollToBottomOfChat();
        }
        setLoadingOldMsgs(false);
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
                            next={fetchOldMessages}
                            style={{
                                display: 'flex',
                                flexDirection: 'column-reverse',
                            }} //To put endMessage and loader to the top.
                            inverse={true}
                            hasMore={hasMoreOldMsgs}
                            //Maybe we add a cusotm loader later
                            loader={<></>}
                            scrollableTarget="chat-box"
                        >
                            {messages.length > 0 &&
                                messages.map(
                                    (
                                        messageModel: MessagePropsModel,
                                        index,
                                    ) => (
                                        <div key={index} className="mt-2">
                                            <Message
                                                message={
                                                    messageModel.envelop.message
                                                        .message ?? ''
                                                }
                                                time={
                                                    messageModel.envelop.message.metadata?.timestamp.toString() ??
                                                    '0'
                                                }
                                                messageState={
                                                    messageModel.messageState
                                                }
                                                ownMessage={
                                                    messageModel.envelop.message
                                                        .metadata?.from ===
                                                    account!.ensName
                                                }
                                                envelop={messageModel.envelop}
                                                reactions={
                                                    messageModel.reactions
                                                }
                                                replyToMessageEnvelop={
                                                    messageModel.replyToMessageEnvelop
                                                }
                                                indicator={
                                                    messageModel.indicator
                                                }
                                                showProfile={
                                                    messageModel.showProfile
                                                }
                                                isFirstMsgOfDay={
                                                    messageModel.isFirstMsgOfDay
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
