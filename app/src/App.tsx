import { useMemo, useState } from 'react';
import { Button, Form, InputNumber, Layout, Table, Space, Tag } from 'antd';

import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import Wallet from "@project-serum/sol-wallet-adapter";
import * as anchor from '@project-serum/anchor';
import BN from "bn.js"


import provider from './lib/AnchorProvider';
import anchorProgram from './lib/program';
import { donationAccount, ownerAccount, network, providerUrl } from './lib/constants';
import { getPdaAddress } from './lib/utils';

import './App.css';
import sponsor from '../../accounts/donation-account.json'

const { Header, Content } = Layout;

const columns = [
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Sum (SOL)',
    dataIndex: 'sum',
    key: 'sum',
  },
];

anchor.setProvider(provider)

function App() {
  const connection = useMemo(() => new Connection(network), [network]);
  const solletWallet = useMemo(() => new Wallet(providerUrl, network), [providerUrl, network]);

  const [connected, setConnected] = useState<boolean>(solletWallet.connected);
  const [balance, setBalance] = useState<number>(0);
  const [owner, setOwner] = useState<PublicKey>(PublicKey.default);
  const [sum, setSum] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<Object>>([]);

  const getSum = async(address: PublicKey) => {
    const accountState = await getPdaAddress('user-stat', address);
    if (accountState.err === null) {
      const data = await anchorProgram.account.accountState.fetch(accountState.address);
      return new BN(data.amount as BN).toNumber() / Math.pow(10, 9)
    } else {
      return 0;
    }
  }

  const getAccounts = async() => {
    const accountList = await getPdaAddress('users-key');
    if (accountList.err === null) {
      const data = await anchorProgram.account.accountListKeys.fetch(accountList.address)
      return data.list
    } else {
      return [];
    }
  }

  const updateAccounts = async() => {
    const accountsAddresses = await getAccounts();
    const accountsInfo = await Promise.all((accountsAddresses as Array<PublicKey>)
      .map(async(publicKey: PublicKey, i: number) => { 
        return {key: i.toString(), address: publicKey.toBase58(), sum: (await getSum(publicKey))}
      }))
    setAccounts(accountsInfo)
  }

  const isOwner = () => owner.toString() === ownerAccount.toString();

  const updateSum = async(address: PublicKey) => {
    setSum(await getSum(address))
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

  const sendLamports = async(from: PublicKey, to: PublicKey , amount: number) => {
    let transaction = new Transaction();
    transaction.feePayer = from;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const stateAccount = await getPdaAddress('user-stat', isOwner() ? donationAccount : solletWallet.publicKey as PublicKey);
    const listAccount = await getPdaAddress('users-key');
    if (stateAccount.err && listAccount.err === null) {
      const txCreateState = await anchorProgram.methods
        .newState()
        .accounts({
          accountState: stateAccount.address,
          accountList: listAccount.address,
          payer: from,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .instruction();
      transaction.add(txCreateState);
    }

    const txTransfer = await anchorProgram.methods
      .transfer(new BN(amount))
      .accounts({
        from, to,
        accountState: stateAccount.address,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .instruction()
    transaction.add(txTransfer);

    if (!isOwner()) {
      transaction = await solletWallet.signTransaction(transaction);
      let signature = await anchor.web3.sendAndConfirmRawTransaction(connection, transaction.serialize());
      console.log("Submitted transaction " + signature + ", awaiting confirmation")
      await connection.confirmTransaction(signature)
      console.log("Transaction " + signature + " confirmed")
    }
    else {
      anchor.web3.sendAndConfirmTransaction(
        connection, 
        transaction, 
        [anchor.web3.Keypair.fromSecretKey(new Uint8Array(sponsor as Array<number>))]
      );
    }
  }

  const onFinish = async(values: any) => {
    if (isOwner()) {
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
          <Content>
            {
              isOwner() ? 
              <Table columns={columns} dataSource={accounts} pagination={false} style={{ padding: 20 }}/> :
              null
            }
            <Form 
              name='basic' 
              labelCol={{ span: 8 }} 
              wrapperCol={{ span:16 }}
              onFinish={onFinish}
            >
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <p style={{margin: 0}}> { isOwner() ? "Total withdraw: " : "Total contributed" } {sum?.toString()} SOL </p>
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <p style={{margin: 0}}> Current balance: {balance?.toString()} SOL</p>
              </Form.Item>

              <Form.Item label="Amount" name="amount" rules={[{ required: true, message: 'Please input donate sum!' }]}>
                <InputNumber addonAfter="Lamport"/>
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type='primary' htmlType='submit'>{isOwner() ? "Take donate" : "Make donate"}</Button>
              </Form.Item> 
            </Form>
          </Content> : 
          null
        }
      </Layout>

    </div>
  );
}

export default App;