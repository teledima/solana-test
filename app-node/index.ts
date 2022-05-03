import * as anchor from '@project-serum/anchor';
import AnchorWallet from './lib/AnchorWallet';
import provider from './lib/AnchorProvider';
import anchorProgram from './lib/program';
import fs from 'fs'

const [counterPDA, bump] =  anchor.web3.PublicKey.findProgramAddressSync([anchor.utils.bytes.utf8.encode("countdsfdfder1")], anchorProgram.programId);

const payer = anchor.web3.Keypair.fromSecretKey(new Uint8Array([12,127,65,37,155,231,215,184,12,51,142,166,20,252,43,166,187,243,240,141,132,126,206,170,105,22,28,195,106,13,73,196,192,22,216,41,149,88,140,91,162,62,48,7,2,146,132,87,66,4,242,79,121,12,162,178,204,68,90,209,9,102,228,108]));

type Result = {
    err: String | null,
    address: anchor.web3.PublicKey
}

async function initCounter() {
    await anchorProgram.rpc.newCounter({
        accounts: {
            counter: counterPDA,
            payer: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId
        }
    });
    console.log('success')
}

async function getCounter() {
    const count = (await anchorProgram.account.accountState.fetch(counterPDA)).counter;
    console.log(count);
    return count
}

async function incremenetCounter() {
    await anchorProgram.rpc.increment({
        accounts: {
            counter: counterPDA
        }
    });
    
    const count = await getCounter();
    console.log(count)
}

async function getStatePdaAddress(address: anchor.web3.PublicKey): Promise<Result> {
    const [addressPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("user-stat"), address.toBuffer() as Buffer],
        anchorProgram.programId
    );

    try {
        const data = await anchorProgram.account.accountState.fetch(addressPDA);
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

async function createState(payer: anchor.web3.Keypair): Promise<void> {
    console.log(payer.publicKey.toBase58())
    const address = await getStatePdaAddress(payer.publicKey);
    /*
    await anchorProgram.rpc.newState({
        accounts: {
            accountState: address.address,
            payer: payer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId
        },
        signers: [payer]
    })*/

    console.log(await anchorProgram.methods.newState().accounts({
        accountState: address.address,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
    }).signers(
        [payer]
    ).rpc())
    
    console.log('success')
    
}


createState(payer)
  .then(() => console.log('end'))
  .catch(reason => console.log(reason));