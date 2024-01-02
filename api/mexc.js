// mexc.js
//
//  curl -X POST -H "Content-Type: application/json" -d '{"name": "GROK", "action": "buy", "timeframe": "1 m", "indicator": "RSI"}' https://sillybot.vercel.app/api/mexc
//
const ccxt = require('ccxt');
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

/**
 * Function to execute a market buy order
 * @param {*} exchange 
 * @param {*} marketSymbol 
 * @param {*} balanceUSDT 
 * @param {*} data 
 */
const executeBuyOrder = async (exchange, marketSymbol, balanceUSDT, data) => {
  try {
    // Fetch the current market price for the specified token
    const ticker = await exchange.fetchTicker(marketSymbol);
    const currentPrice = ticker ? ticker.last : 'N/A';

    // Place a market buy order for the specified token with all available balance
    const buyOrder = await exchange.createMarketBuyOrder(marketSymbol, balanceUSDT);

    // Fetch the updated balance after placing the buy order
    const updatedBalance = await exchange.fetchBalance();
    // const updatedUSDTBalance = updatedBalance['USDT'].free;

    // Calculate the actual balance used in the purchase
    // const actualBalanceUsed = balanceUSDT - updatedUSDTBalance;
    
    await writeActionToDb(data.name, data.action, data.timeframe, currentPrice, balanceUSDT, data.indicator);

    console.log(`Buy order for ${marketSymbol} placed at ${currentPrice} for ${balanceUSDT} USDT:`, buyOrder);

  } catch (error) {
    console.error('Error placing buy order:', error);
    throw error; // Rethrow the error for higher-level error handling
  }
};


/**
 * Function to execute a market sell order
 * @param {*} exchange 
 * @param {*} marketSymbol 
 * @param {*} balanceToken 
 * @param {*} data 
 */
const executeSellOrder = async (exchange, marketSymbol, balanceToken, data) => {
  try {
    // Fetch the current market price for the specified token
    const ticker = await exchange.fetchTicker(marketSymbol);
    const currentPrice = ticker ? ticker.last : 'N/A';

    // Place a market sell order for the specified token with all available balance
    const sellOrder = await exchange.createMarketSellOrder(marketSymbol, balanceToken);

    await writeActionToDb(data.name, data.action, data.timeframe, currentPrice, balanceToken * currentPrice, data.indicator);

    console.log(`Sell order for ${marketSymbol} placed at ${currentPrice} for ${balanceToken * currentPrice} USDT:`, sellOrder);

  } catch (error) {
    console.error('Error placing sell order:', error);
    throw error; // Rethrow the error for higher-level error handling
  }
};

module.exports = async (req, res) => {
  try {
    const data = req.body; // Received webhook data

    // Retrieve API keys from environment variables on Vercel
    const MEXC_API_KEY = process.env.MEXC_API_KEY;
    const MEXC_SECRET = process.env.MEXC_SECRET;

    // Create an instance of the MEXC exchange with API keys from environment variables
    const exchange = new ccxt.mexc({
      apiKey: MEXC_API_KEY,
      secret: MEXC_SECRET,
      // Add a 'options' object for additional configurations
      options: {
        adjustForTimeDifference: true, // Automatically adjusts the request timestamp
      },
    });
    
    // Indicates that the exchange's market buy order functionality will accept orders without explicitly specifying the price
    exchange.options['createMarketBuyOrderRequiresPrice'] = false;

    // Fetch the market symbol based on the received token name
    const marketSymbol = `${data.name}/USDT`; // Assuming the base pair is USDT

    // Fetch all balances for the account
    const allBalances = await exchange.fetchBalance();

    // Find balances for the specified token and USDT
    const balanceToken = allBalances[marketSymbol.split('/')[0]];
    const balanceUSDT = allBalances['USDT'];

    // Check if there are any open orders for the specified symbol and cancel them
    const openOrders = await exchange.fetchOpenOrders(marketSymbol);
    if (openOrders.length > 0) {
      console.log(`Cancelling ${openOrders.length} open orders for ${marketSymbol}`);
      await exchange.cancelOrders(openOrders.map(order => order.id), marketSymbol);
    }

    // Check if the balance is non-zero before initiating the trade
    if (data.action === 'buy' && balanceUSDT && balanceUSDT.free > 5) {
      await executeBuyOrder(exchange, marketSymbol, balanceUSDT.free, data);
    } else if (data.action === 'sell' && balanceToken && balanceToken.free > 0) {
      await executeSellOrder(exchange, marketSymbol, balanceToken.free, data);
    } else {
      console.log('Insufficient balance or invalid action:', data.action);
    }
    
    console.log('Received webhook data:', data);
    console.log('Balance ' + marketSymbol.split('/')[0] + ':', balanceToken ? balanceToken.free : 'N/A');
    console.log('Balance USDT:', balanceUSDT ? balanceUSDT.free : 'N/A');

    res.status(200).json({ message: 'Webhook received successfully!' });

  } catch (error) {
    if (error instanceof ccxt.NetworkError) {
      console.error('Network error occurred:', error);
      res.status(500).json({ error: 'Network error occurred' });
    } else if (error instanceof ccxt.ExchangeError) {
      console.error('Exchange error occurred:', error);
      res.status(500).json({ error: 'Exchange error occurred' });
    } else if (error instanceof ccxt.AuthenticationError) {
      console.error('Authentication error occurred:', error);
      res.status(500).json({ error: 'Authentication error occurred' });
    } else if (error instanceof ccxt.ExchangeNotAvailable) {
      console.error('Exchange not available:', error);
      res.status(500).json({ error: 'Exchange not available' });
    } else if (error instanceof ccxt.ExchangeNotLoaded) {
      console.error('Exchange not loaded:', error);
      res.status(500).json({ error: 'Exchange not loaded' });
    } else {
      console.error('Unknown error occurred:', error);
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};