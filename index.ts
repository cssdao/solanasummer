const fs = require('fs');
const axios = require('axios');
const base64 = require('base-64');
const solanaWeb3 = require('@solana/web3.js');
const { decode } = require('bs58');
const bs58 = require('bs58');

const client = axios.create({
  timeout: 30000,
  headers: {
    Origin: 'https://jup.ag',
  },
});

const rpcClient = new solanaWeb3.Connection(
  'https://jupiter-fe.helius-rpc.com/',
  'confirmed'
);

const args = process.argv.slice(2);
const numWallets = args.length > 0 ? parseInt(args[0], 10) : 50;

if (isNaN(numWallets) || numWallets <= 0) {
  console.error('Please provide a valid number of wallets to create.');
  process.exit(1);
}

const walletKeys = [];
const successKeys = [];

async function main() {
  // 1、批量创建钱包
  for (let i = 0; i < numWallets; i++) {
    const userKey = solanaWeb3.Keypair.generate();
    // const address = userKey.publicKey.toString();
    const privateKey = bs58.encode(userKey.secretKey);
    walletKeys.push(privateKey);
  }

  fs.writeFileSync('wallet.txt', walletKeys.join('\n'), 'utf-8');

  const walletContent = fs.readFileSync('wallet.txt', 'utf8');
  const lines = walletContent.split('\n').filter((line) => line.trim() !== '');

  const wallets = lines.map((line) => {
    const secretKey = bs58.decode(line.trim());
    return solanaWeb3.Keypair.fromSecretKey(secretKey);
  });

  if (wallets.length === 0) {
    console.error('No wallets found in wallet.txt');
    process.exit(1);
  }

  wallets.forEach((wallet) => {
    processWallet(wallet);
  });
}

async function processWallet(wallet) {
  while (true) {
    const txRaw = await getTx(wallet.publicKey.toBase58());

    if (!txRaw) {
      continue;
    }

    await sendTx(wallet, txRaw);
  }
}

async function getTx(address) {
  try {
    const response = await client.post(
      'https://proxy.dial.to/?url=https%3A%2F%2Fsolanasummer.click%2Fon%2Fmint',
      { account: address }
    );
    return response.data.transaction || '';
  } catch (error) {
    console.error('Error fetching transaction:', address);
    return '';
  }
}

async function sendTx(wallet, rawtx) {
  try {
    const txData = base64.decode(rawtx);
    const tx = solanaWeb3.Transaction.from(Buffer.from(txData, 'base64'));

    tx.partialSign(wallet);

    const signature = await solanaWeb3.sendAndConfirmTransaction(
      rpcClient,
      tx,
      [wallet],
      { commitment: 'confirmed' }
    );

    const privateKey = bs58.encode(wallet.secretKey);
    // 从wallet.txt中删除 mint 成功的私钥
    const index = walletKeys.indexOf(privateKey);
    if (index > -1) {
      walletKeys.splice(index, 1);
      fs.writeFileSync('wallet.txt', walletKeys.join('\n'), 'utf-8');
    }

    // 添加到成功列表
    successKeys.push(privateKey);
    fs.writeFileSync('success.txt', successKeys.join('\n'), 'utf-8');

    console.log('Mint success:', {
      address: wallet.publicKey.toBase58(),
      tx: signature,
    });
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

main().catch((err) => console.error('Error in main function:', err));
