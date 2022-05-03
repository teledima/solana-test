import { useMemo, useState } from 'react';
import { Button, Form, InputNumber, Layout } from 'antd';

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import Wallet from "@project-serum/sol-wallet-adapter";
import * as anchor from '@project-serum/anchor';
import BN from "bn.js"


import provider from './lib/AnchorProvider';
import anchorProgram from './lib/program';
import { donationAccount, ownerAccount } from './lib/constants';
import { getStatePdaAddress } from './lib/utils';

import './App.css';
import sponsor from '../../accounts/donation-account.json'

const { Header } = Layout;

const providerUrl = 'https://www.sollet.io';
const network = 'http://localhost:8899';

anchor.setProvider(provider)

function App() {
  const connection = useMemo(() => new Connection(network), [network]);
  const solletWallet = useMemo(() => new Wallet(providerUrl, network), [providerUrl, network]);

  const [connected, setConnected] = useState<boolean>(solletWallet.connected);
  const [balance, setBalance] = useState<number>(0);
  const [owner, setOwner] = useState<PublicKey>(PublicKey.default);
  const [sum, setSum] = useState<number>(0);

  const isOwner = () => owner.toString() === ownerAccount.toString();

  const updateSum = async(address: PublicKey) => {
    const result = await getStatePdaAddress(address);
    if (result.err === null) {
      const data = await anchorProgram.account.accountState.fetch(result.address);
      setSum(new BN(data.amount as BN).toNumber() / Math.pow(10, 9))
    }
  }

  const updateBalance = async(address: PublicKey) => {
    setBalance(await connection.getBalance(address) / Math.pow(10, 9));
  }

  solletWallet.on('connect', async() => {
    setConnected(solletWallet.connected);
    if (solletWallet.publicKey?.toString() === ownerAccount.toString()) {
      setOwner(ownerAccount);
      await updateBalance(donationAccount);
      await updateSum(donationAccount);
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

  const sendLamports = async(from: PublicKey, to: PublicKey , amount: number) => {
    let transaction = new Transaction();
    transaction.feePayer = from;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const stateAddress = await getStatePdaAddress(isOwner() ? donationAccount : solletWallet.publicKey as PublicKey);
    if (stateAddress.err) {
      const txCreateState = await anchorProgram.instruction.newState({
        accounts: {
          accountState: stateAddress.address,
          payer: from,
          systemProgram: anchor.web3.SystemProgram.programId
        }
      });
      transaction.add(txCreateState);
    }

    if (!isOwner()) {
      const tx = await anchorProgram.instruction.transfer(new BN(amount), {
        accounts: {
          from, to,
          accountState: stateAddress.address,
          systemProgram: anchor.web3.SystemProgram.programId
        },
        
      } as any);
      transaction.add(tx);
      console.log(transaction.instructions);
      transaction = await solletWallet.signTransaction(transaction);
      let signature = await anchor.web3.sendAndConfirmRawTransaction(connection, transaction.serialize());
      console.log("Submitted transaction " + signature + ", awaiting confirmation")
      await connection.confirmTransaction(signature)
      console.log("Transaction " + signature + " confirmed")
    }
    else {
      const tx = await anchorProgram.instruction.transfer(new BN(amount), {
        accounts: {
          from, to,
          accountState: stateAddress.address,
          systemProgram: anchor.web3.SystemProgram.programId
        }
      })
      transaction.add(tx);
      anchor.web3.sendAndConfirmTransaction(connection, transaction, [anchor.web3.Keypair.fromSecretKey(new Uint8Array(sponsor as Array<number>))]);
    }
  }

  const onFinish = async(values: any) => {
    if (isOwner()) {
      console.log('start')
      await sendLamports(donationAccount, ownerAccount, values.amount);
      await updateBalance(donationAccount);
      await updateSum(donationAccount);
      console.log(`send ${values.amount} lamport to ${ownerAccount.toBase58()}`);
    }
    else {
      await sendLamports(solletWallet.publicKey as PublicKey, donationAccount, values.amount);
      await updateBalance(solletWallet.publicKey as PublicKey);
      await updateSum(solletWallet.publicKey as PublicKey);
      console.log(`send ${values.amount} lamport from ${solletWallet.publicKey?.toBase58()}`);
    }
  }

  return (
    <div className='App'>
      <Layout>
        <Header>
          <Button type='primary' onClick={async() => await solletWallet.connect()}>Connect wallet</Button>
        </Header>
        {connected ? 
          <Form 
            style={{ padding: 24 }} 
            name='basic' 
            labelCol={{ span: 8 }} 
            wrapperCol={{ span:16 }}
            onFinish={onFinish}
          >
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <p style={{margin: 0}}> Sum: {sum?.toString()} SOL</p>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <p style={{margin: 0}}> Current balance: {balance?.toString()} SOL</p>
            </Form.Item>

            <Form.Item label="Amount" name="amount" rules={[{ required: true, message: 'Please input donate sum!' }]}>
              <InputNumber addonAfter="Lamport"/>
            </Form.Item>

            { 
              isOwner() ? 
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type='primary' htmlType='submit'>Take donate</Button>
              </Form.Item> :
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type='primary' htmlType='submit'>Make donate</Button>
              </Form.Item>
            }
          </Form> : 
          null
        }
      </Layout>

    </div>
  );
}

export default App;