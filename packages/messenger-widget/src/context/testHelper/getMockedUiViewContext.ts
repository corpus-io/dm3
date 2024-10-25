import { UiViewContextType } from '../UiViewContext';
import { MessageAction } from '../../interfaces/props';
import {
    LeftViewSelected,
    MessageActionType,
    RightViewSelected,
} from '../../utils/enum-type-utils';

//Provide a mocked UiView context
//Override the default values with the provided values
export const getMockedUiViewContext = (
    override?: Partial<UiViewContextType>,
) => {
    const defaultValues = {
        selectedLeftView: LeftViewSelected.Contacts,
        setSelectedLeftView: (view: LeftViewSelected) => {
            throw new Error('Function not implemented.');
        },
        selectedRightView: RightViewSelected.Default,
        setSelectedRightView: (view: RightViewSelected) => {
            throw new Error('Function not implemented.');
        },
        messageView: {
            messageData: undefined,
            actionType: MessageActionType.NONE,
        },
        setMessageView: (view: MessageAction) => {
            throw new Error('Function not implemented.');
        },
        resetViewStates: () => {
            throw new Error('Function not implemented.');
        },
    };

    return { ...defaultValues, ...override };
};
