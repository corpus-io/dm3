import { sign } from 'dm3-lib-crypto';
import { stringify } from 'dm3-lib-shared';

export async function createLinkAcceptMessage(
    to: string,
    from: string,
    linkMessage: string,
    lspEnsName: string,
    signature: string,
    sign: (msg: string) => Promise<string>,
): Promise<any> {
    const messgeWithoutSig = {
        message: '',
        attachments: [],
        metadata: {
            type: 'LSP_LINK_ACCEPT',
            to,
            from,
            timestamp: new Date().getTime(),
            LSP: {
                ensName: lspEnsName,
                linkMessage,
                signature,
            },
        },
    };
    return {
        ...messgeWithoutSig,
        signature: await sign(stringify(messgeWithoutSig)),
    };
}
