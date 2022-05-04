import { useMemo, useState } from 'react';
import { Layout } from 'antd';
// Anchor libs
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import Wallet from "@project-serum/sol-wallet-adapter";
import BN from "bn.js";
import * as anchor from '@project-serum/anchor';
// Custom libs
import provider from './lib/AnchorProvider';
import { donationAccount, ownerAccount, network, providerUrl } from './lib/constants';
import sendLamports from './sendLamports';
// Custom components
import AppHeader from './AppHeader';
import { getSum, getAccounts } from './selectors';
import AccountsTable from './AccountsTable';
import DonateForm from './DonateForm';
// Files
import './App.css';


const { Content } = Layout;

anchor.setProvider(provider)

function App() {
  // Cached variables
  const connection = useMemo(() => new Connection(network), [network]);
  const solletWallet = useMemo(() => new Wallet(providerUrl, network), [providerUrl, network]);

  // Wallet callbacks
  solletWallet.on('connect', async() => {
    setConnected(solletWallet.connected);
    if (solletWallet.publicKey?.toString() === ownerAccount.toString()) {
      setOwner(ownerAccount);
      await updateBalance(donationAccount);
      await updateSum(donationAccount);
      await updateAccounts();
    }
    else {
      await updateBalance(solletWallet.publicKey as PublicKey);
      await updateSum(solletWallet.publicKey as PublicKey);
    }
    
    console.log('sollet connected', solletWallet.publicKey?.toBase58());
  });

  solletWallet.on('disconnect', () => {
    setConnected(solletWallet.connected);
    setOwner(PublicKey.default);
    console.log('disconnected');
  });

  // States
  const [connected, setConnected] = useState<boolean>(solletWallet.connected);
  const [balance, setBalance] = useState<number>(0);
  const [owner, setOwner] = useState<PublicKey>(PublicKey.default);
  const [sum, setSum] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<Object>>([]);

  const isOwner = () => owner.toString() === ownerAccount.toString();

  // Update states
  const updateAccounts = async() => {
    const accountsAddresses = await getAccounts();
    const accountsInfo = await Promise.all((accountsAddresses as Array<PublicKey>)
      .map(async(publicKey: PublicKey, i: number) => { 
        const sum = await getSum(publicKey)
        return {key: i.toString(), address: publicKey.toBase58(), sum: publicKey.toString() === donationAccount.toString() ? -sum : sum}
      }))
    setAccounts(accountsInfo)
  }

  const updateSum = async(address: PublicKey) => {
    setSum(await getSum(address))
  }

  const updateBalance = async(address: PublicKey) => {
    setBalance(await connection.getBalance(address) / Math.pow(10, 9));
  }

  // Submit form
  const onFinish = async(values: any) => {
    if (isOwner()) {
      await sendLamports(connection, solletWallet, isOwner(), donationAccount, ownerAccount, values.amount);
      await updateBalance(donationAccount);
      await updateSum(donationAccount);
      console.log(`send ${values.amount} lamport to ${ownerAccount.toBase58()}`);
    }
    else {
      await sendLamports(connection, solletWallet, isOwner(), solletWallet.publicKey as PublicKey, donationAccount, values.amount);
      await updateBalance(solletWallet.publicKey as PublicKey);
      await updateSum(solletWallet.publicKey as PublicKey);
      console.log(`send ${values.amount} lamport from ${solletWallet.publicKey?.toBase58()}`);
    }
  }

  return (
    <div className='App'>
      <Layout>
        <AppHeader onConnect={async() => await solletWallet.connect()}/>
        {connected ? 
          <Content>
            {
              isOwner() ? 
              <AccountsTable data={accounts}/> :
              null
            }
            <DonateForm balance={balance} sum={sum} isOwner={isOwner()} onFinish={onFinish}/>
          </Content> : 
          null
        }
      </Layout>

    </div>
  );
}

export default App;