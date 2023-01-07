/* eslint-disable max-len */
import { ethers } from 'ethers';
import { log } from '../../shared/log';
import { getResolverInterface } from './getResolverInterface';

export function decodeCalldata(calldata: string) {
    try {
        const textResolver = getResolverInterface();

        //Parse the calldata returned by a contra
        const [rawName, data] = textResolver.parseTransaction({
            data: calldata,
        }).args;

        //The name has to be normalized before be it can be processed
        const encodedName = ethers.utils.nameprep(rawName);

        const { signature, args } = textResolver.parseTransaction({
            data,
        });
        const [nameHash, record] = args;

        const name = decodeDnsName(encodedName);

        if (ethers.utils.namehash(name) !== nameHash) {
            throw Error("Namehash doesn't match");
        }

        return { name, record, signature };
    } catch (err: any) {
        log("[Decode Calldata] Can't decode calldata ");
        log(err);
        throw err;
    }
}
/**
 * 

 * {@link https://github.com/ensdomains/offchain-resolver/blob/ed330e4322b1fafe2ffbd1496829c75185dd9e2e/packages/gateway/src/server.ts#L30}
*/
function decodeDnsName(dnsname: string) {
    //Create an Buffer of the name without the leading "0x" sequence
    const nameBuffer = Buffer.from(dnsname.slice(2), 'hex');
    const labels = [];
    let idx = 0;
    while (true) {
        const len = nameBuffer.readUInt8(idx);
        if (len === 0) break;
        labels.push(nameBuffer.slice(idx + 1, idx + len + 1).toString('utf8'));
        idx += len + 1;
    }
    return labels.join('.');
}
