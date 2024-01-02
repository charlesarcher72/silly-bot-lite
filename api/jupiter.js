const { MongoClient, ServerApiVersion } = require('mongodb');
const axios = require('axios');
// const { createJupiterApiClient } = require('jup-ag/api');
const { Connection, Keypair, VersionedTransaction } = require('@solana/web3.js');
const { Wallet } = require('@project-serum/anchor');
const bs58 = require('bs58');
const solanaWeb3 = require('@solana/web3.js');

// Constants
const JUPITER_API_BASE_URL = 'https://price.jup.ag/v4/price';
const JUPITER_SWAP_API_BASE_URL = 'https://station.jup.ag/api';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const SLIPPAGE_BPS = 100;


/**
 * Function to get the balance of a specific token in USDT from the database
 * @param {*} name - The name of the token
 * @param {*} database - The MongoDB database connection
 * @returns The balance of the specified token in USDT
 */
const getTokenBalance = async (walletAddress, name, database, connection) => {
    try {
        // Connect to the database table
        const tokenCollection = database.collection(process.env.DB_TOKENS_COLLECTION);

        // Find the token document in the collection
        const tokenDoc = await tokenCollection.findOne({ name: name });

        const walletUSDTBalance = await getWalletBalance(walletAddress, USDT_MINT, connection);

        // If the token is in the database and has a USDT amount less than the default balance
        if (tokenDoc && tokenDoc.usdtAmount && tokenDoc.usdtAmount < walletUSDTBalance) {
            // If wallet USDT balance is sufficient, return the stored token amount
            return tokenDoc.usdtAmount;
        } else {
            // Adjusting for potential fees or insufficient balance with default balance
            return walletUSDTBalance;
        }
    } catch (error) {
        console.error('Error retrieving token balance from database:', error);
        return 0; // Return the default balance in case of an error
    }
};

/**
 * gets the balance of the token in the wallet
 * @param {*} walletAddress 
 * @param {*} mint 
 * @returns 
 */
async function getWalletBalance(walletAddress, mint, connection) {
    try {
        const walletPublicKey = new solanaWeb3.PublicKey(walletAddress);
        const mintPublicKey = new solanaWeb3.PublicKey(mint);

        const accountInfo = await connection.getParsedTokenAccountsByOwner(walletPublicKey, { mint: mintPublicKey });

        if (accountInfo.value.length === 0) {
            console.log('No tokens found in the wallet.');
            return 0;
        }

        const balance = accountInfo.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return balance;
    } catch (error) {
        console.error('Error fetching USDT balance:', error);
        throw error;
    }
}


/**
 * Function to get current market price from Jupiter Price API
 * @param {*} tokenSymbol 
 * @returns 
 */
async function getCurrentMarketPrice(tokenSymbol) {
  try {
    const response = await axios.get(`${JUPITER_API_BASE_URL}?ids=${tokenSymbol}`);
    return response.data.data[tokenSymbol].price;
  } catch (error) {
    console.error('Error fetching market price:', error);
    throw error;
  }
}

/**
 * Function to get current mint from Jupiter Price API
 * @param {\} tokenSymbol 
 * @returns 
 */
async function getTokenMint(tokenSymbol) {
    try {
        const response = await axios.get(`${JUPITER_API_BASE_URL}?ids=${tokenSymbol}`);
        
        // Accessing the 'id' property which represents the mint address
        const mintAddress = response.data.data[tokenSymbol].id;
        
        return mintAddress;
    } catch (error) {
        console.error('Error fetching token mint:', error);
        throw error;
    }
}

/**
 * Function to execute a market buy or sell order on Jupiter DEX
 * @param {*} action 
 * @param {*} inputMint 
 * @param {*} outputMint 
 * @param {*} amount 
 * @param {*} wallet 
 * @returns 
 */
async function executeOrder(action, inputMint, outputMint, amount, wallet, connection) {
    try {
      // Correctly use template literals for URL construction
      const quoteResponse = await (
          await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}`)
      ).json();

      // get serialized transactions for the swap
        const response = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: wallet.publicKey.toString(),
                wrapAndUnwrapSol: true,
                prioritizationFeeLamports: 'auto'
            })
        });
    
        const data = await response.json();
    
        // Log the entire response for inspection
        console.log('API response:', data);
    
        if (!data.swapTransaction) {
            throw new Error('Swap transaction data not found in response');
        }
    

      // deserialize the transaction
      const swapTransactionBuf = Buffer.from(data.swapTransaction, 'base64');
      var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // sign the transaction
      transaction.sign([wallet.payer]);

      // Execute the transaction
      const rawTransaction = transaction.serialize()
      const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
      });
      await connection.confirmTransaction(txid);
      console.log(`https://solscan.io/tx/${txid}`);

      return txid;
    } catch (error) {
      console.error(`Error executing ${action} order:`, error);
      throw error;
    }
  }

// Main handler function
module.exports = async (req, res) => {// Validate required environment variables
    const uri = process.env.DB_CONNECTION_URI;
    const DB_NAME = process.env.DB_NAME;
    const privateKey = process.env.PRIVATE_KEY; // Ensure this is securely stored
    let txid;
    let tokenAmount;

    if (!uri || !DB_NAME || !privateKey) {
        console.error('Missing required environment variables');
        res.status(500).json({ error: 'Server configuration error' });
        return;
      }

    // Create a database client
    const client = new MongoClient(uri, {
        serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        },
    });

  try {
    const data = req.body;
    const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT);
    const walletKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const walletAddress = walletKeypair.publicKey.toBase58();
    const wallet = new Wallet(walletKeypair);
    const walletPublicKey = new solanaWeb3.PublicKey(walletAddress);

    if (!data.name || !data.action || !data.timeframe || !data.indicator) {
        console.error('Missing required data');
        res.status(500).json({ error: 'Server configuration error' });
        return;
      }

    // Connect to the MongoDB cluster
    await client.connect();

    // Specify the database and collection
    const database = client.db(DB_NAME);

    //const tokenPrice = await getCurrentMarketPrice(data.name);
    const tokenMint = await getTokenMint(data.name);

    // Check if the balance is non-zero before initiating the trade
    if (data.action === 'buy') {
        const usdtAmount = await getTokenBalance(walletAddress, 'USDT', database, connection);
        console.log(usdtAmount);
        txid = await executeOrder(data.action, USDT_MINT, tokenMint, usdtAmount, wallet, connection);
    } else if (data.action === 'sell') {
        if (data.name == 'SOL'){
            // save .1 sol for fees
            tokenAmount = await connection.getBalance(walletPublicKey) - 100000000;
        }
        else{
            tokenAmount = await getWalletBalance(walletAddress, tokenMint, connection);
        }
        console.log(tokenAmount);
        txid = await executeOrder(data.action, tokenMint, USDT_MINT, tokenAmount, wallet, connection);
    } else {
    console.error('Insufficient balance or invalid action:', data.action);
    }

    res.status(200).json({ message: 'Trade executed successfully', txid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
}
};

