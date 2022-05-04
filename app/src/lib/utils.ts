import { PublicKey } from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
import anchorProgram from "./program";

type Result = {
    err: String | null,
    address: PublicKey
}

export async function getPdaAddress(tag: string, address: PublicKey | null = null): Promise<Result> {
    let addressPDA: PublicKey = PublicKey.default;

    if (tag === 'user-stat')
        addressPDA = (await PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode(tag), (address as PublicKey).toBuffer()],
            anchorProgram.programId
        ))[0];
    else
        addressPDA = (await PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode(tag)],
            anchorProgram.programId
        ))[0];

    if (addressPDA.toBase58() === PublicKey.default.toBase58()) {
        return { err: 'Public Key undefined', address: addressPDA }
    }

    try {
        if (tag === 'user-stat')
            await anchorProgram.account.accountState.fetch(addressPDA);
        else if (tag === 'users-key')
            await anchorProgram.account.accountListKeys.fetch(addressPDA);
        return new Promise((resolve, _) => resolve({err: null, address: addressPDA}));
    }
    catch (err) {
        return new Promise((resolve, _) => {
            if (err instanceof Error)
                resolve({err: err.message, address: addressPDA})
            else 
                resolve({err: 'Unknown error', address: addressPDA})
        });
    }
}
