// binance.js

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
const writeActionToDb = async (name, action, timeframe, tokenPrice, usdtPrice, indicator, database) => {
  try {

    // Get the current date and time and format it as ISO 8601
    const currentDateTime = new Date().toISOString();

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

  } catch (error) {
    console.error('Error writing to database:', error);
  }
};

/**
 * update the token balance
 * @param {*} name 
 * @param {*} usdtAmount 
 * @param {*} database 
 */
const updateToken = async (name, usdtAmount, database) => {
  try {
    const tokenCollection = database.collection(process.env.DB_TOKENS_COLLECTION);

    // Update existing token or insert a new one
    const updateResult = await tokenCollection.updateOne(
      { name },
      { $set: { usdtAmount } },
      { upsert: true }
    );

  } catch (error) {
    console.error('Error updating token in database:', error);
  }
};

/**
 * Function to get the balance of a specific token in USDT from the database
 * @param {*} name - The name of the token
 * @param {*} defaultBalance - The default balance to return if not found in the database
 * @param {*} database - The MongoDB database connection
 * @returns The balance of the specified token in USDT
 */
const getTokenBalance = async (name, defaultBalance, balanceBNB, database, exchange) => {
  try {
    // Fetch the current market price for the specified token
    const BNBticker = await exchange.fetchTicker('BNB/USDT');
    const currentPriceBNB = BNBticker ? BNBticker.last : 0;

    // get usdt value of bnb in account
    const BNBinUSDT = currentPriceBNB * balanceBNB;

    // connect to db table
    const tokenCollection = database.collection(process.env.DB_TOKENS_COLLECTION);

    // Find the token document in the collection
    const tokenDoc = await tokenCollection.findOne({ name : name });

    // make sure there is a token in the database and 
    if (tokenDoc && tokenDoc.usdtAmount && (tokenDoc.usdtAmount < defaultBalance)) {
      // if there is enough token and bnb return it
      if (BNBinUSDT > (tokenDoc.usdtAmount * .00075)){
        return tokenDoc.usdtAmount;
      }
      else{
        return tokenDoc.usdtAmount * 0.999;
      }
    }
    else if(BNBinUSDT > (defaultBalance * .00075)){
      return defaultBalance;
    }
    // else not enough BNB so return the balance before fees
    else{
      return defaultBalance * 0.999;
    }    
  } catch (error) {
    console.error('Error retrieving token balance from database:', error);
    return defaultBalance * 0.999; // Return the default balance in case of an error
  }
};

/**
 * Function to execute a market buy order
 * @param {*} exchange 
 * @param {*} marketSymbol 
 * @param {*} balanceUSDT 
 * @param {*} data 
 */
const executeBuyOrder = async (exchange, marketSymbol, balanceUSDT, balanceBNB, data, database) => {
    try {

      // get the balance to use and calculate fees if in BNB or not
      const balancToUse = await getTokenBalance(data.name, balanceUSDT, balanceBNB, database, exchange);
      const balancToUseFormatted = Math.floor(balancToUse * 100) / 100;

      // log the balance
      console.log('Using USDT Balance: ' + balancToUseFormatted);

      // Place a market buy order for the specified token with all available balance
      // const buyOrder = await exchange.createMarketBuyOrder(`${data.name}USDT`, ((balancToUseFormatted) / currentPrice) ); 
  
      // Buy order specifying the USDT amount
      const buyOrder = await exchange.createMarketBuyOrder(`${data.name}USDT`, undefined, { 'quoteOrderQty': balancToUseFormatted });
      // exchange.create_order(`${data.name}USDT`, 'market', 'buy', null, null, { 'quoteOrderQty': balancToUseFormatted });

      // Fetch the current market price for the specified token
      const ticker = await exchange.fetchTicker(marketSymbol);
      const currentPrice = ticker ? ticker.last : 'N/A';
      
      // update db history
      await writeActionToDb(data.name, data.action, data.timeframe, currentPrice, balancToUseFormatted, data.indicator, database);
    
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
const executeSellOrder = async (exchange, marketSymbol, balanceToken, data, database) => {
  try {
    // Fetch the current market price for the specified token
    const ticker = await exchange.fetchTicker(marketSymbol);
    const currentPrice = ticker ? ticker.last : 'N/A';

    // format the usdt
    const balancToUseFormatted = Math.floor(balanceToken * 100) / 100;

    // Place a market sell order for the specified token with all available balance
    const sellOrder = await exchange.createMarketSellOrder(`${data.name}USDT`, balancToUseFormatted);

    // Calculate the total sell value from order fills
    let totalSellValue = 0;
    if (sellOrder.fills && sellOrder.fills.length > 0) {
      sellOrder.fills.forEach(fill => {
        totalSellValue += fill.price * fill.amount;
      });
    } else {
      // Fallback if fills are not available, use the executed price
      const executedPrice = sellOrder.average || sellOrder.price;
      totalSellValue = balancToUseFormatted * executedPrice;
    }

    // update the history database
    await writeActionToDb(data.name, data.action, data.timeframe, currentPrice, totalSellValue, data.indicator, database);

    // update the token database if it exists
    await updateToken(data.name, totalSellValue, database);

  } catch (error) {
    console.error('Error placing sell order:', error);
    throw error; // Rethrow the error for higher-level error handling
  }
};


/**
 * main
 * @param {*} req 
 * @param {*} res 
 */
module.exports = async (req, res) => {
  // Validate required environment variables
  const uri = process.env.DB_CONNECTION_URI;
  const DB_NAME = process.env.DB_NAME;
  const BINANCE_US_API_KEY = process.env.BINANCE_US_API_KEY;
  const BINANCE_US_SECRET = process.env.BINANCE_US_SECRET;

  if (!uri || !DB_NAME || !BINANCE_US_API_KEY || !BINANCE_US_SECRET) {
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
    const data = req.body; // Received webhook data

    if (!data.name || !data.action || !data.timeframe || !data.indicator) {
      console.error('Missing required data');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Connect to the MongoDB cluster
    await client.connect();

    // Specify the database and collection
    const database = client.db(DB_NAME);

    // Create an instance of the MEXC exchange with API keys from environment variables
    const exchange = new ccxt.binanceus({
        apiKey: BINANCE_US_API_KEY,
        secret: BINANCE_US_SECRET,
        // Add a 'options' object for additional configurations
        options: {
          adjustForTimeDifference: true, // Automatically adjusts the request timestamp
        },
      });
    
    // Indicates that the exchange's market buy order functionality will accept orders without explicitly specifying the price
    exchange.options['createMarketBuyOrderRequiresPrice'] = false;
    exchange.options['quoteOrderQty'] = true;

    // Fetch the market symbol based on the received token name
    const marketSymbol = `${data.name}/USDT`; // Assuming the base pair is USDT

    // Fetch all balances for the account
    const allBalances = await exchange.fetchBalance();

    // Find balances for the specified token and USDT
    const balanceToken = allBalances[marketSymbol.split('/')[0]];
    const balanceUSDT = allBalances['USDT'];
    const balanceBNB = allBalances['BNB'];

    // Check if there are any open orders for the specified symbol and cancel them
    const openOrders = await exchange.fetchOpenOrders(marketSymbol);
    if (openOrders.length > 0) {
      await exchange.cancelOrders(openOrders.map(order => order.id), marketSymbol);
    }

    // Check if the balance is non-zero before initiating the trade
    if (data.action === 'buy' && balanceUSDT && balanceUSDT.free > 0) {
      await executeBuyOrder(exchange, marketSymbol, balanceUSDT.free, balanceBNB.free, data, database);
    } else if (data.action === 'sell' && balanceToken && balanceToken.free > 0) {
      await executeSellOrder(exchange, marketSymbol, balanceToken.free, data, database);
    } else {
      console.error('Insufficient balance or invalid action:', data.action);
    }
    
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
  } finally {
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error closing the database connection:', closeError);
    };
  }
};