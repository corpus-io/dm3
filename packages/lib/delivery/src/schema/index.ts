import AcknowledgementSchema from './Acknowledgement.schema.json';
import DeliveryServicePropertiesSchema from './DeliveryServiceProperties.schema.json';
import AccountSchema from './Account.schema.json';
import NotificationChannelSchema from './NotificationChannel.schema.json';

export const Acknowledgement =
    AcknowledgementSchema.definitions.Acknowledgement;
export const DeliveryServiceProperties = DeliveryServicePropertiesSchema;
export const Account = AccountSchema;
export const NotificationChannel = NotificationChannelSchema;
