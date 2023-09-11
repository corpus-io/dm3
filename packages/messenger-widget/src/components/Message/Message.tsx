import './Message.css';
import { useContext, useState } from 'react';
import {
    Envelop,
    MessageState,
    SendDependencies,
    createDeleteRequestMessage,
} from 'dm3-lib-messaging';
import tickIcon from '../../assets/images/tick.svg';
import { MessageProps } from '../../interfaces/props';
import threeDotsIcon from '../../assets/images/three-dots.svg';
import { MessageAction } from '../MessageAction/MessageAction';
import { GlobalContext } from '../../utils/context-utils';
import { MessageActionType, ModalStateType } from '../../utils/enum-type-utils';
import DeleteMessage from '../DeleteMessage/DeleteMessage';
import {
    getDependencies,
    getHaltDelivery,
    sendMessage,
} from '../../utils/common-utils';
import { scrollToBottomOfChat } from '../Chat/bl';

export function Message(props: MessageProps) {
    const { state, dispatch } = useContext(GlobalContext);

    // state to show action items three dots
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseOver = () => {
        setIsHovered(true);
        if (props.isLastMessage) {
            scrollToBottomOfChat();
        }
    };

    const handleMouseOut = () => {
        setIsHovered(false);
    };

    const getMessageChangeText = (): string => {
        switch (props.envelop.message.metadata.type) {
            case 'EDIT':
                return '(edited) ';
            case 'DELETE_REQUEST':
                return '(deleted) ';
            default:
                return '';
        }
    };

    const deleteEmoji = async (deleteEmojiData: Envelop) => {
        if (!props.ownMessage) {
            const userDb = state.userDb;

            if (!userDb) {
                throw Error('userDB not found');
            }

            if (!state.accounts.selectedContact) {
                throw Error('no contact selected');
            }

            const messageHash = deleteEmojiData.metadata?.encryptedMessageHash;

            // delete the message
            const messageData = await createDeleteRequestMessage(
                state.accounts.selectedContact?.account.ensName as string,
                state.connection.account!.ensName,
                userDb.keys.signingKeyPair.privateKey as string,
                messageHash as string,
            );

            messageData.metadata.type = MessageActionType.REACT;

            const haltDelivery = getHaltDelivery(state);
            const sendDependencies: SendDependencies = getDependencies(state);

            await sendMessage(
                state,
                sendDependencies,
                messageData,
                haltDelivery,
                dispatch,
            );

            dispatch({
                type: ModalStateType.LastMessageAction,
                payload: MessageActionType.DELETE,
            });
        }
    };

    return (
        <span
            className={'text-primary-color d-grid msg'.concat(
                ' ',
                props.ownMessage
                    ? 'me-2 justify-content-end'
                    : 'ms-2 justify-content-start',
            )}
        >
            {/* delete message popup */}
            {state.uiView.selectedMessageView.actionType ===
                MessageActionType.DELETE && <DeleteMessage />}

            <div className="d-flex">
                <div
                    className={'width-fill text-left font-size-14 border-radius-6 content-style'.concat(
                        ' ',
                        (props.ownMessage
                            ? state.uiView.selectedMessageView.actionType ===
                                  MessageActionType.EDIT &&
                              state.uiView.selectedMessageView.messageData
                                  ?.envelop.id === props.envelop.id
                                ? 'msg-editing-active'
                                : 'ms-3 background-config-box'
                            : 'normal-btn-hover'
                        ).concat(
                            ' ',
                            props.reactions.length > 0
                                ? props.ownMessage
                                    ? 'own-reacted-msg'
                                    : 'contact-reacted-msg'
                                : '',
                        ),
                    )}
                >
                    {/* show the preview of reply message */}
                    {props.replyToMsg &&
                        props.replyToMsgFrom &&
                        props.envelop.message.metadata.type ===
                            MessageActionType.REPLY && (
                            <div className="reply-preview d-flex border-radius-4 normal-btn-inactive ">
                                <div className="user-name">
                                    {props.replyToMsgFrom.length > 25
                                        ? props.replyToMsgFrom
                                              .substring(0, 25)
                                              .concat(': ')
                                        : props.replyToMsgFrom.concat(':')}
                                </div>
                                {props.replyToMsg
                                    .substring(0, 20)
                                    .concat('...')}
                            </div>
                        )}
                    {/* actual message */}
                    {props.message ? props.message : 'This message was deleted'}
                </div>
                {/* action item */}
                <div
                    className={'msg-action-container d-flex pointer-cursor border-radius-3 position-relative'.concat(
                        ' ',
                        !props.message ? 'hide-action' : '',
                    )}
                    onMouseOver={handleMouseOver}
                    onMouseLeave={handleMouseOut}
                >
                    <img
                        className="msg-action-dot"
                        src={threeDotsIcon}
                        alt="action"
                    />
                    {isHovered && <MessageAction {...props} />}
                </div>
            </div>

            <div
                className={'d-flex justify-content-end text-secondary-color time-style'.concat(
                    ' ',
                    props.reactions.length > 0
                        ? !props.ownMessage
                            ? 'justify-content-between'
                            : 'ms-3 justify-content-end'
                        : props.ownMessage
                        ? 'ms-3'
                        : '',
                )}
            >
                {/* Own message */}
                {props.ownMessage && (
                    <div className="d-flex justify-content-end pt-1 ps-1 pe-1">
                        {getMessageChangeText()}
                        {new Date(Number(props.time)).toLocaleString()}

                        {/* readed message tick indicator */}
                        <span className="tick-icon readed-tick-icon">
                            {props.messageState === MessageState.Read ? (
                                <>
                                    <img src={tickIcon} alt="read" />
                                    <img
                                        src={tickIcon}
                                        alt="read"
                                        className="second-tick"
                                    />
                                </>
                            ) : (
                                <img src={tickIcon} alt="read" />
                            )}
                        </span>
                    </div>
                )}

                {/* Reaction emojis */}
                {props.reactions.length > 0 && (
                    <div
                        className={'reacted d-flex'.concat(
                            ' ',
                            props.ownMessage
                                ? 'background-config-box'
                                : 'normal-btn-hover',
                        )}
                    >
                        {props.reactions.map((item, index) => {
                            return (
                                item.message.message && (
                                    <div
                                        key={index}
                                        className="pointer-cursor"
                                        onClick={() => {
                                            deleteEmoji(item);
                                        }}
                                    >
                                        {item.message.message}
                                    </div>
                                )
                            );
                        })}
                    </div>
                )}

                {/* Contact's message */}
                {!props.ownMessage && (
                    <div className="d-flex justify-content-end pt-1 ps-1 pe-1">
                        {getMessageChangeText()}
                        {new Date(Number(props.time)).toLocaleString()}
                        {/* readed message tick indicator */}
                        <span className="tick-icon readed-tick-icon">
                            <img src={tickIcon} alt="read" />
                        </span>
                    </div>
                )}
            </div>
        </span>
    );
}
