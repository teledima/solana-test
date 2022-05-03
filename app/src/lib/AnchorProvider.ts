import * as anchor from '@project-serum/anchor';
import AnchorWallet from './AnchorWallet';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { network } from './constants';

const provider = new anchor.AnchorProvider(new Connection(network), AnchorWallet.local(), { skipPreflight: false })
export default provider;