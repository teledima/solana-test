import { 
    PublicKey, 
    Transaction, 
    SystemProgram, 
    Keypair, 
    sendAndConfirmTransaction, 
    sendAndConfirmRawTransaction, 
    Connection} 
from "@solana/web3.js";

import { donationAccount } from "./lib/constants";
import { getPdaAddress } from "./lib/utils";
import anchorProgram from "./lib/program";
import BN from "bn.js";

import donationSecret from '../../accounts/donation-account.json'
import Wallet from "@project-serum/sol-wallet-adapter";

const sendLamports = async(connection: Connection, wallet: Wallet, isOwner: boolean, from: PublicKey, to: PublicKey , amount: number) => {
    let transaction = new Transaction();
    transaction.feePayer = from;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const stateAccount = await getPdaAddress('user-stat', isOwner ? donationAccount : wallet.publicKey as PublicKey);
    const listAccount = await getPdaAddress('users-key');
    if (stateAccount.err && listAccount.err === null) {
      const txCreateState = await anchorProgram.methods
        .newState()
        .accounts({
          accountState: stateAccount.address,
          accountList: listAccount.address,
          payer: from,
          systemProgram: SystemProgram.programId
        })
        .instruction();
      transaction.add(txCreateState);
    }

    const txTransfer = await anchorProgram.methods
      .transfer(new BN(amount))
      .accounts({
        from, to,
        accountState: stateAccount.address,
        systemProgram: SystemProgram.programId
      })
      .instruction()
    transaction.add(txTransfer);

    if (!isOwner) {
      transaction = await wallet.signTransaction(transaction);
      let signature = await sendAndConfirmRawTransaction(connection, transaction.serialize());
      console.log("Submitted transaction " + signature + ", awaiting confirmation")
      await connection.confirmTransaction(signature)
      console.log("Transaction " + signature + " confirmed")
    }
    else {
      sendAndConfirmTransaction(
        connection, 
        transaction, 
        [Keypair.fromSecretKey(new Uint8Array(donationSecret as Array<number>))]
      );
    }
};

export default sendLamports;