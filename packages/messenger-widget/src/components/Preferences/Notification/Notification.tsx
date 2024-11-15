import { useContext } from 'react';
import { DeleteIcon } from './DeleteIcon';
import { Checkbox, Text } from './Content';
import { Heading } from '../Heading/Heading';
import { VerificationModal } from './VerificationModal';
import { NotificationButton } from './NotificationButton';
import { NotificationChannelType } from '@dm3-org/dm3-lib-shared';
import { MOBILE_SCREEN_WIDTH } from '../../../utils/common-utils';
import { getVerficationModalContent } from './hooks/VerificationContent';
import { DM3ConfigurationContext } from '../../../context/DM3ConfigurationContext';
import { NotificationContext } from '../../../context/NotificationContext';
import loader from '../../../assets/images/loader.svg';
import { ModalContext } from '../../../context/ModalContext';

export function Notification() {
    const { screenWidth } = useContext(DM3ConfigurationContext);

    const heading = 'Notification';
    const description =
        screenWidth <= MOBILE_SCREEN_WIDTH
            ? ''
            : 'Prevent spam from being sent to you by setting rules ' +
              'that senders must fulfill in order for messages to be accepted.';

    const {
        isNotificationsActive,
        isEmailActive,
        setIsEmailActive,
        isMobileActive,
        setIsMobileActive,
        isPushNotifyActive,
        setIsPushNotifyActive,
        email,
        setEmail,
        phone,
        setPhone,
        updateNotificationActive,
        activeVerification,
        setActiveVerification,
        activeVerificationContent,
        setActiveVerificationContent,
        toggleSpecificNotificationChannel,
        pushNotificationAction,
        isLoading,
        loaderData,
    } = useContext(NotificationContext);

    const { disabledOptions } = useContext(ModalContext);

    return (
        <div className="position-relative h-100">
            <Heading heading={heading} description={description} />

            {/* Verification popup */}
            {activeVerification && (
                <VerificationModal {...activeVerificationContent} />
            )}

            {/* Shows loader on the screen while any action is in progress */}
            {isLoading && (
                <div className="notification-loading">
                    <img
                        className="rotating loader-img"
                        src={loader}
                        alt="loader"
                    />
                    <div className="loader-content">{loaderData}</div>
                </div>
            )}

            {/* Notifications enabled/disabled */}
            <div className="global-notification-container">
                <div className="d-flex align-items-center">
                    <Checkbox
                        checked={isNotificationsActive}
                        disabled={false}
                        action={(d: boolean) => updateNotificationActive(d)}
                        heading="Activate Notifications"
                    />
                </div>
                <Text
                    disabled={false}
                    text={
                        'Notifications are sent if a message is waiting for you at the delivery service. ' +
                        'There are different types of notification you can select.'
                    }
                />
            </div>

            {/* Email notifications enabled/disabled */}
            {!disabledOptions.notification.email && (
                <div className="notification-content-left mt-4">
                    <div className="d-flex align-items-center">
                        <Checkbox
                            checked={isEmailActive}
                            disabled={!isNotificationsActive}
                            action={() =>
                                toggleSpecificNotificationChannel(
                                    !isEmailActive,
                                    NotificationChannelType.EMAIL,
                                    setIsEmailActive,
                                )
                            }
                            heading="Email"
                        />
                        {email && isNotificationsActive ? (
                            <DeleteIcon
                                data={email}
                                type={NotificationChannelType.EMAIL}
                                deleteNotification={setEmail}
                            />
                        ) : (
                            <NotificationButton
                                text="Add Email"
                                disabled={
                                    !isNotificationsActive || !isEmailActive
                                }
                                action={() => {
                                    setActiveVerification(
                                        NotificationChannelType.EMAIL,
                                    );
                                    setActiveVerificationContent(
                                        getVerficationModalContent(
                                            NotificationChannelType.EMAIL,
                                            setActiveVerification,
                                            setEmail,
                                        ),
                                    );
                                }}
                            />
                        )}
                    </div>
                    <Text
                        disabled={!isNotificationsActive}
                        text={
                            'An email is sent to inform you that a message is waiting for you at a delivery service.'
                        }
                    />
                    <span className="experimental-fun">
                        Experimental function. Do not use in production!
                    </span>
                </div>
            )}

            {/* Mobile notifications enabled/disabled */}
            {/* <div className="notification-content-left mt-4">
                <div className="d-flex  align-items-center">
                    <Checkbox
                        checked={isMobileActive}
                        disabled={!isNotificationsActive}
                        action={setIsMobileActive}
                        heading="SMS"
                    />
                    {phone ? (
                        <DeleteIcon
                            data={phone}
                            type={VerificationMethod.Telephone}
                            deleteNotification={deletePhone}
                        />
                    ) : (
                        <NotificationButton
                            text="Add Phone Number"
                            disabled={!isNotificationsActive}
                            action={() => {
                                setActiveVerification(
                                    VerificationMethod.Telephone,
                                );
                                setActiveVerificationContent(
                                    getVerficationModalContent(
                                        VerificationMethod.Telephone,
                                        setActiveVerification,
                                        setPhone,
                                    ),
                                );
                            }}
                        />
                    )}
                </div>
                <Text
                    disabled={!isNotificationsActive}
                    text={
                        'A SMS is sent to your phone number to inform you that a ' +
                        'message is waiting for you at a delivery service.'
                    }
                />
            </div> */}

            {/* Push notifications enabled/disabled */}
            {!disabledOptions.notification.push && (
                <div className="notification-content-left mt-4">
                    <div className="d-flex align-items-center">
                        <Checkbox
                            checked={isPushNotifyActive}
                            disabled={!isNotificationsActive}
                            action={() =>
                                pushNotificationAction(!isPushNotifyActive)
                            }
                            heading="Push Notifications"
                        />
                    </div>
                    <Text
                        disabled={!isNotificationsActive}
                        text={'Enable push notifications to your browser.'}
                    />
                </div>
            )}
        </div>
    );
}
