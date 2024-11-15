import './Settings.css';
import { useContext } from 'react';
import { Heading } from '../Heading/Heading';
import { ModalContext } from '../../../context/ModalContext';
import { SettingsContext } from '../../../context/SettingsContext';

export function Settings() {
    // heading of the page
    const heading = 'Settings';

    // description of the page
    const description = 'Define how you want to enable/disable components';

    const { disabledOptions } = useContext(ModalContext);
    const { msgViewOptions, msgViewSelected, updateMsgView } =
        useContext(SettingsContext);

    return (
        <div>
            {/* heading of the page */}
            <Heading heading={heading} description={description} />

            {/* Show message option selection when option is not disabled */}
            {!disabledOptions.settings.messageView && (
                <>
                    {/* title and description of the property */}
                    <div className="settings-msg-view">
                        <div className="mt-2 font-weight-800 msg-view-heading">
                            Message View
                        </div>
                        <div className="font-size-14 msg-view-desc">
                            Select a view how the message should look like
                        </div>
                    </div>

                    {/* radio button options to select the message view type */}
                    <div>
                        <div className="settings-option-container">
                            {msgViewOptions.map((option, index) => (
                                <div
                                    key={index}
                                    className="radio d-flex mb-3 width-fit"
                                    onClick={() => {
                                        updateMsgView(option);
                                    }}
                                >
                                    <input
                                        type="radio"
                                        value={option.viewType}
                                        checked={
                                            option.viewType ===
                                            msgViewSelected.viewType
                                        }
                                        readOnly
                                    />
                                    <label className="settings-option radio-label">
                                        {option.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
