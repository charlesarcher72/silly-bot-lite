// Import necessary modules
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Define the handler function
module.exports = async (req, res) => {
    // Check for necessary environment variables
    const uri = process.env.DB_CONNECTION_URI;
    const dbName = process.env.DB_NAME;
    const tokensCollectionName = process.env.DB_TOKENS_COLLECTION;
  
    if (!uri || !dbName || !tokensCollectionName) {
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
    const collection = database.collection(process.env.DB_TOKENS_COLLECTION);

    if (req.method === 'POST') {
      const { name, usdtAmount } = req.body;
      
      // Validate input
      if (!name || typeof usdtAmount !== 'number') {
        res.status(400).send('Invalid input');
        return;
      }

      // Update existing token or insert a new one
      const updateResult = await collection.updateOne(
        { name },
        { $set: { usdtAmount } },
        { upsert: true }
      );

      // Check if a new document was created
      if (updateResult.upsertedCount > 0) {
        res.status(201).json({ message: 'Token added successfully', token: { name, usdtAmount } });
      } else {
        res.status(200).json({ message: 'Token updated successfully', token: { name, usdtAmount } });
      }
    } else if (req.method === 'GET') {
      // Fetch all documents in the collection
      const documents = await collection.find({}).toArray();

      // Send the data as JSON response
      res.json(documents);
    } else if (req.method === 'DELETE') {
      try {
        // Retrieve the token's unique ID from the request, typically passed as a URL parameter
        const { name } = req.body;

        // Check if the tokenId is provided
        if (!name) {
          res.status(400).send('Token Name is required');
          return;
        }
  
        // Delete the token from the database
        const result = await collection.deleteMany({ name: name});

        // Send a success response
        res.status(200).json({ message: 'Token deleted successfully' });
      } catch (error) {
        console.error('Error deleting token:', error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      // Unsupported HTTP method
      res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the connection when done, whether an error occurred or not
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error closing the database connection:', closeError);
    }
    }
};
