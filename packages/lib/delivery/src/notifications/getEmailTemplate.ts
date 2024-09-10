import { DeliveryInformation } from '@dm3-org/dm3-lib-messaging';
import { NotificationType } from './types';
import {
    NEW_MSG_EMAIL_SUBJECT,
    NEW_MSG_EMAIL_TEMPLATE,
} from './templates/newMessage';
import { OTP_EMAIL_SUBJECT, OTP_EMAIL_TEMPLATE } from './templates/otp';
import { OTP_EXPIRY_DURATION } from '../Notification';

// to fetch subject & template of email based on notification type
export const fetchEmailSubjectAndTemplate = (
    notificationType: NotificationType,
    mailContent: any,
): {
    subject: string;
    template: string;
} => {
    switch (notificationType) {
        case NotificationType.NEW_MESSAGE:
            return {
                subject: NEW_MSG_EMAIL_SUBJECT,
                template: NEW_MSG_EMAIL_TEMPLATE(
                    mailContent as DeliveryInformation,
                ),
            };
        case NotificationType.OTP:
            // generate otp and save in DB & return OTP
            return {
                subject: OTP_EMAIL_SUBJECT,
                template: OTP_EMAIL_TEMPLATE(
                    mailContent.otp as string,
                    getEmailDate(),
                    OTP_EXPIRY_DURATION / 60, // time in minutes
                    mailContent.dm3ContactEmailID as string,
                ),
            };
        default:
            throw new Error(
                `Notification type ${notificationType} is not supported`,
            );
    }
};

// NOTE : This is added for current email template, in future can be removed
// generates date in format : Jan 30, 2024
const getEmailDate = () => {
    const options: object = { year: 'numeric', month: 'short', day: 'numeric' };
    const today = new Date();
    return today.toLocaleDateString('en-US', options);
};
