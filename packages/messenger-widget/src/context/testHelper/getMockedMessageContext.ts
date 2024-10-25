import { MessageContextType } from '../MessageContext';

//Provide a mocked Message context
//Override the default values with the provided values
export const getMockedMessageContext = (
    override?: Partial<MessageContextType>,
) => {
    const defaultValues = {
        getMessages: (contact: string) => [],
        getUnreadMessageCount: (contact: string) => 0,
        addMessage: (contact: string, message: any) =>
            new Promise(() => {
                isSuccess: true;
            }),
        loadMoreMessages: (contact: string) =>
            new Promise(() => {
                return 0;
            }),
        contactIsLoading: (contact: string) => false,
        messages: {},
    };

    return { ...defaultValues, ...override };
};
