// Importing the necessary modules and functions
import cors from 'cors';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import express from 'express';
import { authorizationMiddleware } from '@dm3-org/dm3-lib-server-side';
import { ethers } from 'ethers';
import {
    validateNewNotificationChannelData,
    validateNotificationChannelType,
} from './validation/notification/notificationChannelValidation';
import {
    NotificationError,
    DeliveryServiceProperties,
    addNewNotificationChannel,
    verifyOtp,
    sendOtp,
    toggleNotificationChannel,
    removeNotificationChannel,
} from '@dm3-org/dm3-lib-delivery';
import { IDatabase } from './persistence/getDatabase';
import { validateToggleNotificationChannel } from './validation/notification/enableOrDisableChannelValidation';
import { NotificationChannelType } from '@dm3-org/dm3-lib-shared';

// Exporting a function that returns an Express router
export default (
    deliveryServiceProperties: DeliveryServiceProperties,
    db: IDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    serverSecret: string,
) => {
    const router = express.Router();

    // Applying CORS middleware to allow cross-origin requests
    router.use(cors());

    // Adding a route parameter middleware named 'ensName'
    router.param('ensName', (req, res, next, ensName: string) => {
        authorizationMiddleware(
            req,
            res,
            next,
            ensName,
            db.hasAccount,
            web3Provider,
            serverSecret,
        );
    });

    // Defining a route to enable/disable global notifications
    router.post('/global/:ensName', async (req, res, next) => {
        try {
            const account = normalizeEnsName(req.params.ensName);

            // Extracting isEnabled from the request body
            const { isEnabled } = req.body;

            // return if value is not a boolean
            if (typeof isEnabled !== 'boolean') {
                return res.status(400).json({
                    error: 'Invalid value',
                });
            }

            // set global notification to the database
            await db.setGlobalNotification(account, isEnabled);

            // Sending a success response
            res.sendStatus(200);
        } catch (e) {
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle GET requests for fetching global notification
    router.get('/global/:ensName', async (req, res, next) => {
        try {
            const account = normalizeEnsName(req.params.ensName);

            // fetching global notification setting for a user from the database
            const globalNotification = await db.getGlobalNotification(account);

            // Sending the fetched global notification setting as a JSON response
            return res.status(200).json(globalNotification);
        } catch (e) {
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle POST requests to verify OTP
    router.post('/otp/verify/:ensName', async (req, res, next) => {
        // Extracting notificationChannelType from the request body
        const { notificationChannelType, otp } = req.body;

        try {
            const account = normalizeEnsName(req.params.ensName);

            // validate otp is present
            if (!otp) {
                return res.status(400).json({
                    error: 'OTP is missing',
                });
            }

            // Validate notificationChannelType data
            const { isValid, errorMessage } = validateNotificationChannelType(
                notificationChannelType,
            );

            // Return if invalid data found
            if (!isValid) {
                return res.status(400).json({
                    error: errorMessage,
                });
            }

            // Fetch global notification data of user from database
            const globalNotification = await db.getGlobalNotification(account);

            // if global notification is turned off
            if (!globalNotification.isEnabled) {
                return res.status(400).json({
                    error: 'Global notifications is off',
                });
            }

            // verify otp
            await verifyOtp(
                account,
                notificationChannelType,
                otp,
                deliveryServiceProperties.notificationChannel,
                db,
            );

            // Sending a success response
            res.sendStatus(200);
        } catch (e: any) {
            if (e instanceof NotificationError) {
                return res.status(400).json({
                    error: e.message,
                });
            }
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle POST requests for resending OTP
    router.post('/otp/:ensName', async (req, res, next) => {
        // Extracting notificationChannelType from the request body
        const { notificationChannelType } = req.body;

        try {
            const account = normalizeEnsName(req.params.ensName);

            // Validate notificationChannelType data
            const { isValid, errorMessage } = validateNotificationChannelType(
                notificationChannelType,
            );

            // Return if invalid data found
            if (!isValid) {
                return res.status(400).json({
                    error: errorMessage,
                });
            }

            // Fetch global notification data of user from database
            const globalNotification = await db.getGlobalNotification(account);

            // if global notification is turned off
            if (!globalNotification.isEnabled) {
                return res.status(400).json({
                    error: 'Global notifications is off',
                });
            }

            await sendOtp(
                account,
                notificationChannelType,
                deliveryServiceProperties.notificationChannel,
                db,
            );

            // Sending a success response
            res.sendStatus(200);
        } catch (e: any) {
            if (e instanceof NotificationError) {
                return res.status(400).json({
                    error: e.message,
                });
            }
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle POST requests to enable/ disable notification channel
    router.post('/channel/:ensName', async (req, res, next) => {
        // Extracting notificationChannelType from the request body
        const { notificationChannelType, isEnabled } = req.body;

        try {
            const account = normalizeEnsName(req.params.ensName);

            // Validate notificationChannelType & isEnabled data
            const { isValid, errorMessage } = validateToggleNotificationChannel(
                notificationChannelType,
                isEnabled,
            );

            // Return if invalid data found
            if (!isValid) {
                return res.status(400).json({
                    error: errorMessage,
                });
            }

            // Fetch global notification data of user from database
            const globalNotification = await db.getGlobalNotification(account);

            // if global notification is turned off
            if (!globalNotification.isEnabled) {
                return res.status(400).json({
                    error: 'Global notifications is off',
                });
            }

            // enable or disable notification
            await toggleNotificationChannel(
                account,
                isEnabled,
                notificationChannelType,
                deliveryServiceProperties.notificationChannel,
                db,
            );

            // Sending a success response
            res.sendStatus(200);
        } catch (e: any) {
            if (e instanceof NotificationError) {
                return res.status(400).json({
                    error: e.message,
                });
            }
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle POST requests for adding an notification channel
    router.post('/:ensName', async (req, res, next) => {
        // Extracting recipientValue & notificationChannelType from the request body
        const { recipientValue, notificationChannelType } = req.body;

        try {
            const account = normalizeEnsName(req.params.ensName);

            // Validate req.body data
            const { isValid, errorMessage } =
                validateNewNotificationChannelData(
                    notificationChannelType,
                    recipientValue,
                );

            // Return if invalid data found
            if (!isValid) {
                return res.status(400).json({
                    error: errorMessage,
                });
            }

            // Fetch global notification data of user from database
            const globalNotification = await db.getGlobalNotification(account);

            // Throw error if global notification is turned off
            if (!globalNotification.isEnabled) {
                return res.status(400).json({
                    error: 'Global notifications is off',
                });
            }

            // add new notification channel & send OTP for verification
            await addNewNotificationChannel(
                notificationChannelType,
                recipientValue,
                account,
                deliveryServiceProperties.notificationChannel,
                db,
            );

            // Sending a success response
            res.sendStatus(200);
        } catch (e: any) {
            if (e instanceof NotificationError) {
                return res.status(400).json({
                    error: e.message,
                });
            }
            console.log('Error while adding notification channel : ', e);
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle GET requests for fetching notification channels
    router.get('/:ensName', async (req, res, next) => {
        try {
            const account = normalizeEnsName(req.params.ensName);

            // Fetch global notification data of user from database
            const globalNotification = await db.getGlobalNotification(account);

            // if global notification is turned off
            if (!globalNotification.isEnabled) {
                return res.status(200).json({ notificationChannels: [] });
            }

            // Getting notification channels for a user from the database
            const notificationChannels = await db.getUsersNotificationChannels(
                account,
            );

            // Sending the fetched notification channels as a JSON response
            return res.status(200).json({ notificationChannels });
        } catch (e) {
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle DELETE requests to remove notification channel
    router.delete('/channel/:channelType/:ensName', async (req, res, next) => {
        // Extracting channelType from the request body
        const { channelType } = req.params;

        try {
            const account = normalizeEnsName(req.params.ensName);

            // Validate channelType
            const { isValid, errorMessage } =
                validateNotificationChannelType(channelType);

            // Return if invalid data found
            if (!isValid) {
                return res.status(400).json({
                    error: errorMessage,
                });
            }

            // Fetch global notification data of user from database
            const globalNotification = await db.getGlobalNotification(account);

            // if global notification is turned off
            if (!globalNotification.isEnabled) {
                return res.status(400).json({
                    error: 'Global notifications is off',
                });
            }

            // remove notification notification
            await removeNotificationChannel(
                account,
                channelType as NotificationChannelType,
                db,
            );

            // Sending a success response
            return res.status(200).json({
                message: `Notification channel ${channelType} has been removed successfully`,
            });
        } catch (e: any) {
            if (e instanceof NotificationError) {
                return res.status(400).json({
                    error: e.message,
                });
            }
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Returning the configured router
    return router;
};
