// api/webhook.js
//
// test json:  {"name": "tokenSymbol", "action": "buy/sell", "timeframe": "1 m", "tokenprice": "2.3", "usdtprice": "19", "indicator": "RSI"}
//

const ccxt = require('ccxt');
const { MongoClient, ServerApiVersion } = require('mongodb');

/**
 * Function to write an action to the database
 * @param {*} client 
 * @param {*} name 
 * @param {*} price
 * @param {*} action  
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
    await client.close();
  }
};

module.exports = async (req, res) => {
  try {
    const data = req.body;
    await writeActionToDb(data.name, data.action, data.timeframe, data.tokenprice, data.usdtprice, data.indicator);
    console.log('Received webhook data:', data);
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};
