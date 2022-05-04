import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { getPdaAddress } from "./lib/utils";
import anchorProgram from "./lib/program";


export const getAccounts = async() => {
    const accountList = await getPdaAddress('users-key');
    if (accountList.err === null) {
      const data = await anchorProgram.account.accountListKeys.fetch(accountList.address)
      return data.list
    } else {
      return [];
    }
}

export const getSum = async(address: PublicKey) => {
    const accountState = await getPdaAddress('user-stat', address);
    if (accountState.err === null) {
      const data = await anchorProgram.account.accountState.fetch(accountState.address);
      return new BN(data.amount as BN).toNumber() / Math.pow(10, 9)
    } else {
      return 0;
    }
}
