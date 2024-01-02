require('dotenv').config();
const { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } = require('@solana/web3.js');
const { MongoClient, ServerApiVersion } = require('mongodb');

/**
 * Function to write an action to the database
 * @param {*} name 
 * @param {*} action 
 * @param {*} timeframe 
 * @param {*} tokenPrice 
 * @param {*} usdtPrice 
 * @param {*} indicator 
 */
const writeActionToDb = async (name, action, timeframe, tokenPrice, usdtPrice, indicator) => {
  // Create a database client
  const uri = process.env.DB_CONNECTION_URI;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    /*
      Retrieve database information from environment variables on Vercel
    */
    const DB_NAME = process.env.DB_NAME;

    // Get the current date and time and format it as ISO 8601
    const currentDateTime = new Date().toISOString();

    // Connect to the MongoDB cluster
    await client.connect();

    // Specify the database and collection
    const database = client.db(DB_NAME);
    const collection = database.collection(process.env.DB_COLLECTION); // Specify the collection here

    // Insert a document into the collection
    const result = await collection.insertOne({
      name,
      action,
      timeframe,
      tokenPrice,
      usdtPrice,
      datetime: currentDateTime, // Using ISO 8601 formatted datetime
      indicator
    });

    console.log(`Document inserted with _id: ${result.insertedId}`);
  } catch (error) {
    console.error('Error writing to database:', error);
  } finally {
    // Close the connection when done
    await client.close();
  }
};

// Function to perform a Solana token buy action
const executeSolanaBuyOrder = async (connection, fromWallet, tokenMint, amount, data) => {
  
   // await writeActionToDb(data.name, data.action, data.timeframe, currentPrice, balanceUSDT, data.indicator);
};

// Function to perform a Solana token sell action
const executeSolanaSellOrder = async (connection, fromWallet, tokenMint, amount, data) => {

    //await writeActionToDb(data.name, data.action, data.timeframe, currentPrice, balanceUSDT, data.indicator);
};

// Main function
module.exports = async (req, res) => {
  try {
    const data = req.body; // Received webhook data
    console.log('Received webhook data:', data);

    // Connect to the Solana blockchain using a node endpoint
    const solanaEndpoint = process.env.SOLANA_NODE_ENDPOINT; // Replace with your Solana node endpoint
    const connection = new Connection(solanaEndpoint, 'recent');

    // Fetch the private key from environment variables
    const privateKey = process.env.PHANTOM_PRIVATE_KEY;
    const fromWallet = new Account(privateKey);

    // Replace with the actual token mint address of Solana
    const tokenMint = process.env.SOLANA_TOKEN_MINT_ADDRESS; // Example token mint address for Solana

    // Example amount for buy and sell actions
    const amount = 0; 
    const amountToken = 0; 

    // Check if the balance is non-zero before initiating the trade
    if (data.action === 'buy' && balanceUSDT && balanceUSDT.free > 5) {
        await executeSolanaBuyOrder(connection, fromWallet, tokenMint, amount, data);
    } else if (data.action === 'sell' && balanceToken && balanceToken.free > 0) {
        await executeSolanaSellOrder(connection, fromWallet, tokenMint, amount, data);
    } else {
        console.log('Insufficient balance or invalid action:', data.action);
    }
    
      res.status(200).json({ message: 'Webhook received successfully!' });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'An error occurred while processing the orders' });
  }
};
