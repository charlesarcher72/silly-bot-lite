// Import necessary modules
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Define the handler function
module.exports = async (req, res) => {
  // Check for necessary environment variables
  const uri = process.env.DB_CONNECTION_URI;
  const dbName = process.env.DB_NAME;
  const collectionName = process.env.DB_COLLECTION;

  if (!uri || !dbName || !collectionName) {
    console.error('Missing required environment variables: DB_CONNECTION_URI, DB_NAME, DB_COLLECTION');
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

    try {
      const admin = database.admin();
      const serverStatus = await admin.serverStatus();

      const databaseStatus = serverStatus.ok === 1 ? 'Connected' : 'Disconnected';
      const itemCount = await collection.countDocuments();
      const connections = serverStatus.connections.current;

      const healthData = {
        databaseStatus,
        itemCount,
        connections,
      };

      // Send the health data as a JSON response
      res.json(healthData);
    } catch (error) {
      console.error('Error fetching health data:', error);
      res.status(500).send('Internal Server Error');
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
