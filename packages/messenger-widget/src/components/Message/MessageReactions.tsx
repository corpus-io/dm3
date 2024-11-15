import './Message.css';
import { useContext } from 'react';
import { MessageProps } from '../../interfaces/props';
import {
    Envelop,
    createDeleteRequestMessage,
} from '@dm3-org/dm3-lib-messaging';
import { ConversationContext } from '../../context/ConversationContext';
import { MessageActionType } from '../../utils/enum-type-utils';
import { AuthContext } from '../../context/AuthContext';
import { MessageContext } from '../../context/MessageContext';
import { UiViewContext } from '../../context/UiViewContext';
import { ModalContext } from '../../context/ModalContext';

export function MessageReactions(props: MessageProps) {
    const { addMessage } = useContext(MessageContext);
    const { setMessageView } = useContext(UiViewContext);
    const { account, profileKeys } = useContext(AuthContext);
    const { setLastMessageAction } = useContext(ModalContext);
    const { selectedContact } = useContext(ConversationContext);

    const deleteEmoji = async (deleteEmojiData: Envelop) => {
        /**
         * User can't remove reactions on his own messages.
         * As the other account can only react to my messages.
         * And only that other account can remove those reactions.
         **/
        if (props.ownMessage) {
            return;
        }

        if (!selectedContact) {
            throw Error('no contact selected');
        }

        const messageHash = deleteEmojiData.metadata?.messageHash;

        setMessageView({
            actionType: MessageActionType.NONE,
            messageData: undefined,
        });

        // delete the message
        const messageData = await createDeleteRequestMessage(
            selectedContact?.contactDetails.account.ensName,
            account!.ensName,
            profileKeys!.signingKeyPair.privateKey,
            messageHash!,
        );

        await addMessage(messageData.metadata.to, messageData);

        setLastMessageAction(MessageActionType.DELETE);
    };

    return (
        props.reactions.length > 0 && (
            <div
                className={'reacted d-flex'.concat(
                    ' ',
                    props.ownMessage
                        ? 'own-msg-background'
                        : 'contact-msg-background',
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
        )
    );
}
