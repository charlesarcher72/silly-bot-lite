// server.js

const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});