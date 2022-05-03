import * as anchor from '@project-serum/anchor';
import AnchorWallet from './AnchorWallet';
import { Connection } from '@solana/web3.js';

const network = 'http://localhost:8899';

const provider = new anchor.AnchorProvider(new Connection(network), AnchorWallet.local(), { skipPreflight: false })
export default provider;