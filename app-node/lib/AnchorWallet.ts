import { Wallet } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export default class AnchorWallet implements Wallet {
    constructor(readonly payer: Keypair) {}
    
    static local(): AnchorWallet {
        const payer = new Uint8Array([144,3,189,94,170,155,229,158,73,3,195,186,241,193,162,3,78,38,1,184,206,29,92,139,72,230,68,78,92,59,38,146,102,174,170,88,223,222,175,183,60,27,77,0,37,99,76,205,187,6,5,248,67,253,192,145,241,217,98,120,211,153,48,254]);
        return new AnchorWallet(Keypair.fromSecretKey(payer))
    }

    async signTransaction(tx: Transaction): Promise<Transaction> {
        tx.partialSign(this.payer);
        return tx;
    }
    
    async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
        return txs.map(t => (window as any).solana.signTransaction(this.payer));
    }

    get publicKey(): PublicKey {
        return this.payer.publicKey;
    }
}