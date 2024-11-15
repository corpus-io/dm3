import { ContactPreview } from '../../interfaces/utils';
import { ConversationContextType } from '../ConversationContext';

//Provide a mocked Authenticate context
//Override the default values with the provided values
export const getMockedConversationContext = (
    override?: Partial<ConversationContextType>,
) => {
    const defaultValues: ConversationContextType = {
        contacts: [],
        setSelectedContactName: (contactEnsName: string | undefined) => {},
        conversationCount: 0,
        initialized: false,
        selectedContactName: undefined,
        selectedContact: undefined,
        addConversation: (ensName: string) => {
            return Promise.resolve({} as ContactPreview);
        },
        hydrateExistingContactAsync: (contact: ContactPreview) =>
            Promise.resolve({} as ContactPreview),
        loadMoreConversations: () => {
            return new Promise((resolve, reject) => resolve(0));
        },
        hideContact: (ensName: string) => {},
        updateConversationList: (contact: string, updatedAt: number) => {},
    };

    return { ...defaultValues, ...override };
};
