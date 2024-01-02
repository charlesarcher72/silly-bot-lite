// Import necessary modules
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

function getRandomTime() {
  const currentTime = new Date().getTime();
  const randomOffset = Math.floor(Math.random() * 60 * 24); // Random offset in minutes for a day
  const randomTime = new Date(currentTime - randomOffset * 60 * 1000);
  return randomTime;
}

// Function to generate an array of times
function generateTimeArray(length, dec_s) {
  const initialTime = getRandomTime();
  const timeArray = [initialTime];

  for (let i = 1; i < length; i++) {
    const previousTime = timeArray[i - 1];
    const newTime = new Date(previousTime.getTime() - dec_s * 60 * 1000);
    timeArray.push(newTime);
  }

  return timeArray;
}
// Function to generate test data based on the provided sample
function generateTestData() {
  // Generate random date times within the last 5 hours
  const startDateTime = new Date();
  const endDateTime = new Date(startDateTime.getTime() + 300 * 60 * 1000);

  const dateTimesA = generateTimeArray(3, 60);
  const dateTimesB = generateTimeArray(4, 1);
  const dateTimesC = generateTimeArray(4, 10);
  const dateTimesD = generateTimeArray(4, 1);
  const dateTimesE = generateTimeArray(2, 60);
  
  const sampleData = [
    {"name": "AAAA", "action": "buy", "timeframe": "1h", "tokenPrice": 130, "usdtPrice": 13000, "datetime": dateTimesA[0], "indicator": "RSI"},
    {"name": "AAAA", "action": "sell", "timeframe": "1h", "tokenPrice": 120, "usdtPrice": 12000, "datetime": dateTimesA[1], "indicator": "RSI"},
    {"name": "AAAA", "action": "buy", "timeframe": "1h", "tokenPrice": 100, "usdtPrice": 10000, "datetime": dateTimesA[2], "indicator": "RSI"},

    {"name": "BBBB", "action": "sell", "timeframe": "1m", "tokenPrice": 50, "usdtPrice": 5000, "datetime": dateTimesB[0], "indicator": "RSI"},
    {"name": "BBBB", "action": "buy", "timeframe": "1m", "tokenPrice": 40, "usdtPrice": 4000, "datetime": dateTimesB[1], "indicator": "RSI"},
    {"name": "BBBB", "action": "sell", "timeframe": "1m", "tokenPrice": 45, "usdtPrice": 4500, "datetime": dateTimesB[2], "indicator": "RSI"},
    {"name": "BBBB", "action": "buy", "timeframe": "1m", "tokenPrice": 50, "usdtPrice": 5000, "datetime": dateTimesB[3], "indicator": "RSI"},

    {"name": "CCCC", "action": "sell", "timeframe": "10m", "tokenPrice": 80, "usdtPrice": 8000, "datetime": dateTimesC[0], "indicator": "SuperTrend"},
    {"name": "CCCC", "action": "buy", "timeframe": "10m", "tokenPrice": 100, "usdtPrice": 10000, "datetime": dateTimesC[1], "indicator": "SuperTrend"},
    {"name": "CCCC", "action": "sell", "timeframe": "10m", "tokenPrice": 90, "usdtPrice": 9000, "datetime": dateTimesC[2], "indicator": "SuperTrend"},
    {"name": "CCCC", "action": "buy", "timeframe": "10m", "tokenPrice": 80, "usdtPrice": 8000, "datetime": dateTimesC[3], "indicator": "SuperTrend"},

    {"name": "DDDD", "action": "sell", "timeframe": "1m", "tokenPrice": 65, "usdtPrice": 6500, "datetime": dateTimesD[0], "indicator": "Volume"},
    {"name": "DDDD", "action": "buy", "timeframe": "1m", "tokenPrice": 60, "usdtPrice": 6000, "datetime": dateTimesD[1], "indicator": "Volume"},
    {"name": "DDDD", "action": "sell", "timeframe": "1m", "tokenPrice": 75, "usdtPrice": 7500, "datetime": dateTimesD[2], "indicator": "Volume"},
    {"name": "DDDD", "action": "buy", "timeframe": "1m", "tokenPrice": 60, "usdtPrice": 6000, "datetime": dateTimesD[3], "indicator": "Volume"},

    {"name": "EEEE", "action": "sell", "timeframe": "1h", "tokenPrice": 190, "usdtPrice": 19000, "datetime": dateTimesE[0], "indicator": "SuperTrend"},
    {"name": "EEEE", "action": "buy", "timeframe": "1h", "tokenPrice": 160, "usdtPrice": 16000, "datetime": dateTimesE[1], "indicator": "SuperTrend"},
  ];

  return sampleData;
}

// Define the handler function
module.exports = async (req, res) => {
  // Check for necessary environment variables
  const uri = process.env.DB_CONNECTION_URI;
  const dbName = process.env.DB_NAME;
  const collectionName = process.env.DB_COLLECTION;

  if (!uri || !dbName || !collectionName) {
    console.error('Missing required environment variables');
    res.status(500).send('Server configuration error');
    return;
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Specify the database and collection
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection(process.env.DB_COLLECTION);

    if (req.method === 'GET') {
      // Fetch all documents in the collection
      const documents = await collection.find({}).sort({ datetime: -1 }).toArray();

      // Send the data as JSON response
      res.json(documents);
    } else if (req.method === 'DELETE') {
      if (req.query.name && req.query.name.toLowerCase() !== 'all') {
        // Delete data for a specific name
        const { name } = req.query;
        await collection.deleteMany({ name: name });
        // Send a success response
        res.json({ message: `Data for ${name} deleted successfully` });
      } else {
        // Delete all documents in the collection
        await collection.deleteMany({});
        // Send a success response
        res.json({ message: 'All data deleted successfully' });
      }
    } else if (req.method === 'PUT') {
      // Populate the database with sample data
      const testData = generateTestData();
      await collection.insertMany(testData);

      // Send a success response
      res.json({ message: 'Test data populated successfully' });
    } else {
      // Unsupported HTTP method
      res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the connection when done
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error closing the database connection:', closeError);
    }
  }
};
