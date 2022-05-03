import { PublicKey } from "@solana/web3.js";
import program from './program';
import * as anchor from '@project-serum/anchor';

type Result = {
    err: String | null,
    address: PublicKey
}

export async function getStatePdaAddress(address: PublicKey): Promise<Result> {

    const [addressPDA, _] = await PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("user-stat"), address.toBuffer()],
        program.programId
    );

    try {
        const data = await program.account.accountState.fetch(addressPDA);
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
