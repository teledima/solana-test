import anchorProgram from "../lib/program";
import provider from "../lib/AnchorProvider";
import { getPdaAddress } from "../lib/utils";
import * as anchor from '@project-serum/anchor';

(async () => {
    let listAccount = await getPdaAddress('users-key');
    if (listAccount.err) {
        await anchorProgram.methods
          .newList()
          .accounts({
              accountList: listAccount.address,
              payer: provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId
          })
          .rpc();

        console.log(`account ${listAccount.address.toBase58()} successfully initialized`) 
    } else {
        console.log(`account ${listAccount.address.toBase58()} already initialized`)
        const data = await anchorProgram.account.accountListKeys.fetch(listAccount.address);
        console.log(data.list);
    }
})();