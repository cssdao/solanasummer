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

async function main() {
  const walletContent = fs.readFileSync('wallet.txt', 'utf8');
  const lines = walletContent.split('\n').filter((line) => line.trim() !== '');

  const wallets = lines.map((line) => {
    const secretKey = bs58.decode(line.trim());
    return solanaWeb3.Keypair.fromSecretKey(secretKey);
  });

  wallets.forEach((wallet) => {
    processWallet(wallet);
  });
}

async function processWallet(wallet) {
  console.log('Processing wallet:', wallet);
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
    // console.error('Error fetching transaction:', error);
    console.error('Error fetching transaction');
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
    console.log('Mint success:', {
      address: wallet.publicKey.toBase58(),
      tx: signature,
    });
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

main().catch((err) => console.error('Error in main function:', err));
