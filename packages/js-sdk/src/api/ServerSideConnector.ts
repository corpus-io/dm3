import { sign } from '@dm3-org/dm3-lib-crypto';
import {
    ProfileKeys,
    SignedUserProfile,
    normalizeEnsName,
} from '@dm3-org/dm3-lib-profile';
import axios from 'axios';
import { JwtInterceptor } from './JwtInterceptor';
import { claimAddress } from './resolver/claimAddress';

//Interface to support different kinds of signers
export type SignMessageFn = (message: string) => Promise<string>;
//Facilitates either BE or DS
export abstract class ServerSideConnector extends JwtInterceptor {
    private readonly baseUrl: string;
    private readonly resolverBackendUrl: string;
    private readonly addressSubdomain: string;
    private readonly address: string;
    private readonly profileKeys: ProfileKeys;
    private readonly signedUserProfile: SignedUserProfile;

    constructor(
        baseUrl: string,
        resolverBackendUrl: string,
        addrEnsSubdomain: string,
        address: string,
        profileKeys: ProfileKeys,
        signedUserProfile: SignedUserProfile,
        //Websocket is disabled per default as not every connector needs a WS connection
        enableWebsocket: boolean = false,
    ) {
        super(
            baseUrl,
            normalizeEnsName(address + addrEnsSubdomain),
            enableWebsocket,
        );

        this.baseUrl = baseUrl;
        this.resolverBackendUrl = resolverBackendUrl;
        this.addressSubdomain = addrEnsSubdomain;
        this.address = address;
        this.profileKeys = profileKeys;
        this.signedUserProfile = signedUserProfile;
    }

    public async login(signedUserProfile: SignedUserProfile) {
        const isAlreadySignedUp = await this.profileExistsOnDeliveryService();
        //User has profile either onchain or at the resolver and has already sign up with the DS
        if (isAlreadySignedUp) {
            return await this._login(signedUserProfile);
        }
        //  User has profile onchain but not interacted with the DS yet
        return await this._signUp(signedUserProfile);
    }
    protected override onReAuth(): Promise<string> {
        return this.reAuth();
    }

    private async _signUp(signedUserProfile: SignedUserProfile) {
        await claimAddress(
            this.address,
            this.resolverBackendUrl as string,
            //removes the leading . from the subdomain.
            //This is necessary as the resolver does not support subdomains with leading dots
            //We can consider to remove the leading dot from the subdomain in the constructor,
            //however that would be a bigger breaking change
            this.addressSubdomain.substring(1),
            signedUserProfile,
        );

        const deliveryServiceToken = await this.submitUserProfile(
            signedUserProfile,
        );
        this.setAuthToken(deliveryServiceToken);
        return {
            deliveryServiceToken,
            signedUserProfile,
            profileKeys: this.profileKeys,
        };
    }

    private async _login(signedUserProfile: SignedUserProfile) {
        const keys = this.profileKeys;
        const deliveryServiceToken = await this.reAuth();
        this.setAuthToken(deliveryServiceToken);

        return {
            profileKeys: keys,
            deliveryServiceToken,
            signedUserProfile,
        };
    }

    private async reAuth() {
        try {
            //TODO check if we need alias subdomain
            const url = `${this.baseUrl}/auth/${normalizeEnsName(
                this.ensName,
            )}`;

            const { data: challenge } = await axios.get(url);

            const signature = await sign(
                this.profileKeys.signingKeyPair.privateKey,
                challenge,
            );

            //Todo move to lib
            const { data: newToken } = await axios.post(url, {
                signature,
                challenge,
            });

            return newToken;
        } catch (err) {
            // It handles the case when client provides new nonce value.
            // The old nonce profile throws error of "Invalid Signature", so old profile
            // is overiden by the new profile with new nonce provided by the client
            if (err.response.data.error === 'Signature invalid') {
                const token = await this.submitUserProfile(
                    this.signedUserProfile,
                );
                this.setAuthToken(token);
                return token;
            }
        }
    }

    private async profileExistsOnDeliveryService() {
        const path = `${this.baseUrl}/profile/${this.ensName}`;
        try {
            const { status } = await axios.get(path);
            return status === 200;
        } catch (err) {
            return false;
        }
    }

    private async submitUserProfile(signedUserProfile: SignedUserProfile) {
        const url = `${this.baseUrl}/profile/${this.ensName}`;
        const { data } = await axios.post(url, signedUserProfile);
        return data;
    }
}
