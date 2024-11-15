import './../Preferences.css';
import { useContext } from 'react';
import closeIcon from '../../../assets/images/cross.svg';
import { ModalContext } from '../../../context/ModalContext';
import { closeConfigurationModal } from '../../ConfigureProfile/bl';
import { MOBILE_SCREEN_WIDTH } from '../../../utils/common-utils';
import { DM3ConfigurationContext } from '../../../context/DM3ConfigurationContext';

export interface IHeading {
    heading: string;
    description: string;
}

export function Heading(props: IHeading) {
    const { screenWidth } = useContext(DM3ConfigurationContext);

    const {
        setShowPreferencesModal,
        setShowProfileConfigurationModal,
        resetConfigureProfileModal,
    } = useContext(ModalContext);

    return (
        <div className="background-container d-flex justify-content-between">
            <div className="preferences-content">
                <h4 className="mb-0 font-weight-800 preferences-topic">
                    {props.heading}
                </h4>
                <span className="font-weight-500 font-size-12">
                    {props.description}
                </span>
            </div>
            {screenWidth > MOBILE_SCREEN_WIDTH && (
                <img
                    className="close-modal-icon m-2"
                    src={closeIcon}
                    alt="close"
                    onClick={() => {
                        resetConfigureProfileModal();
                        setShowPreferencesModal(false);
                        closeConfigurationModal(
                            setShowProfileConfigurationModal,
                        );
                    }}
                />
            )}
        </div>
    );
}
