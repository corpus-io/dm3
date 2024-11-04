import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { Dm3KeyStore } from '../KeyStore/IKeyStore';
import { EncodeDataReturn } from '@erc725/erc725.js/build/main/src/types';
import { ethers } from 'ethers';
import {
    Data,
    DecodeDataOutput,
} from '@erc725/erc725.js/build/main/src/types/decodeData';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import { SignedUserProfile } from '@dm3-org/dm3-lib-profile';

export class ERC725JsonCoder {
    public static readonly schemas: ERC725JSONSchema[] = [
        ...LSP6Schema,
        {
            name: 'DM3Keystore:<address>',
            key: '0x89197c814f5df4249c18<address>',
            keyType: 'Mapping',
            valueType: 'bytes[CompactBytesArray]',
            valueContent: 'Bytes',
        },
        {
            name: 'DM3UserProfile:<address>',
            key: '0xc0885b43cac3a34d9414<address>',
            keyType: 'Mapping',
            valueType: 'bytes[CompactBytesArray]',
            valueContent: 'Bytes',
        },
    ];

    private readonly erc725: ERC725;
    constructor(_erc725: ERC725 = new ERC725(ERC725JsonCoder.schemas)) {
        this.erc725 = _erc725;
    }

    public encodeDm3KeyStoreEntry(
        controllerAddress: string,
        signerPublicKey: string,
        encryptedProfileKeys: string = '0x',
    ): EncodeDataReturn {
        const enc = this.erc725.encodeData(
            [
                {
                    keyName: 'DM3Keystore:<address>',
                    dynamicKeyParts: [controllerAddress],
                    value: [
                        ethers.utils.hexlify(
                            ethers.utils.toUtf8Bytes(signerPublicKey),
                        ),
                        ethers.utils.hexlify(
                            ethers.utils.toUtf8Bytes(encryptedProfileKeys),
                        ),
                    ],
                },
            ],
            ERC725JsonCoder.schemas,
        );

        return enc;
    }

    public encodeDm3Profile(
        controllerAddress: string,
        userProfile: SignedUserProfile,
    ): EncodeDataReturn {
        const { profile, signature } = userProfile;
        const { publicSigningKey, publicEncryptionKey, deliveryServices } =
            profile;
        const enc = this.erc725.encodeData([
            {
                keyName: 'DM3UserProfile:<address>',
                dynamicKeyParts: [controllerAddress],
                value: [
                    ethers.utils.hexlify(
                        ethers.utils.toUtf8Bytes(publicSigningKey),
                    ),
                    ethers.utils.hexlify(
                        ethers.utils.toUtf8Bytes(publicEncryptionKey),
                    ),
                    ethers.utils.hexlify(
                        ethers.utils.toUtf8Bytes(
                            JSON.stringify(deliveryServices),
                        ),
                    ),
                    ethers.utils.hexlify(ethers.utils.toUtf8Bytes(signature)),
                ],
            },
        ]);
        return enc;
    }

    public async decodeDm3Profile(
        upAddress: string,
    ): Promise<SignedUserProfile | undefined> {
        const encodedUserProfile = await this.erc725.getData({
            keyName: 'DM3UserProfile:<address>',
            dynamicKeyParts: upAddress,
        });
        if (encodedUserProfile.value === null) {
            return undefined;
        }

        const [
            publicSigningKey,
            publicEncryptionKey,
            deliveryServices,
            signature,
        ] = encodedUserProfile.value as Data[];

        return {
            profile: {
                publicSigningKey: ethers.utils.toUtf8String(
                    publicSigningKey as string,
                ),
                publicEncryptionKey: ethers.utils.toUtf8String(
                    publicEncryptionKey as string,
                ),
                deliveryServices: JSON.parse(
                    ethers.utils.toUtf8String(deliveryServices as string),
                ),
            },
            signature: ethers.utils.toUtf8String(signature as string),
        };
    }

    public async decodeDm3KeyStore(): Promise<Dm3KeyStore> {
        const controllerAddresses = await this.erc725.getData(
            'AddressPermissions[]',
        );

        const dataPromises = (controllerAddresses.value as Data[]).map(
            (address) =>
                this.erc725.getData({
                    keyName: 'DM3Keystore:<address>',
                    dynamicKeyParts: address as string,
                }),
        );

        const results = await Promise.all(dataPromises);
        const filtered = results.filter((r) => r.value !== null);

        const ks = filtered.reduce((acc, curr: DecodeDataOutput) => {
            const key = curr!.dynamicName as string;
            const value = curr!.value as Data[];

            acc[key.substring(12)] = {
                signerPublicKey: ethers.utils.toUtf8String(value[0] as string),
                encryptedProfileKeys: ethers.utils.toUtf8String(
                    value[1] as string,
                ),
            };
            return acc;
        }, {} as Dm3KeyStore);

        return ks;
    }
}
//"0x89197c814f5df4249c180000c73abaa79d9d562d07f09d8135b72b047908bbe6"
//"0x89197c814f5df4249c1800007870c5b8bc9572a8001c3f96f7ff59961b23500d"
