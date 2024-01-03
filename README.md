# Silly Bot Lite 🤖

Silly Bot Lite is a cryptocurrency trading bot that leverages TradingView alerts via a webhook to make transactions on the Binance platform. The application is built with React for the front end, uses a MongoDB database, and is hosted on Vercel. Explore a live demo with sample data [here](https://silly-bot-lite.vercel.app/)!
<div alight="center">

[![Powered by Vercel](https://img.shields.io/badge/Powered%20by-Vercel-blue)](https://vercel.com/) [![Built with React](https://img.shields.io/badge/Built%20with-React-blue)](https://reactjs.org/)

</div>

## Developers 👨‍💻👨‍💻

The development of Silly Bot Lite is led by the following developers:

- **Charles Archer**
  - GitHub: [charlesarcher72](https://github.com/charlesarcher72)

- **Gage Wassweiler**
  - GitHub: [GW1919](https://github.com/GW1919)

Feel free to check out their GitHub profiles to learn more about their contributions to Silly Bot Lite.

## Features 🚀

Silly Bot Lite comes with the following key features:

- **TradingView Integration:** Leverages TradingView alerts via webhooks for real-time market data.
- **Binance API Integration:** Executes transactions on the Binance platform using the Binance API.
- **React Front End:** User-friendly front end built with React for a seamless experience.
- **MongoDB Database:** Utilizes MongoDB for efficient data storage and retrieval.
- **Transaction History:** Provides a transaction history page that displays data for transactions made by the bot.
- **Token Management:** Allows user to add types of crypto tokens and set the amount you want to use for trades.
- **Database Management:** Allows the user to clear the transaction history, tokens, and populate the database with sample test data.
- **Profit Analytics:** Provides ability to analyze and display the performance and profitability of trading activities.

These features make Silly Bot Lite a powerful tool for cryptocurrency trading with a focus on simplicity and real-time data processing.

## Technologies Used 🛠️

The following technologies were used in the development of Silly Bot Lite:

- **React:** A JavaScript library for building user interfaces.
- **Binance API:** Used to interact with the Binance cryptocurrency exchange for trading.
- **MongoDB:** A NoSQL database used to store application data.
- **Vercel:** A cloud platform for hosting and deploying React applications.
- **Node.js:** The JavaScript runtime used for building server-side applications.
- **TradingView:** A web-based charting platform used for creating and managing trading alerts.
- **Webhooks:** Used for receiving real-time alerts from TradingView to trigger actions in the application.
- **GitHub:** The version control system and code hosting platform for collaboration.

These technologies were chosen to create a robust and efficient cryptocurrency trading bot with real-time alert capabilities.

## Getting Started 🚀

Follow these steps to get started with Silly Bot Lite:

1. **Fork the Repository:**
   - Fork the Silly Bot Lite repository on GitHub by clicking the "Fork" button on the top right of the repository page.

2. **Create Database:**
   - Create a free-tier MongoDB database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

3. **Setup Binance.US API:**
   - Obtain your Binance.US API key and secret from the [Binance API Management](https://www.binance.com/en/my/settings/api-management).

4. **Host the Application on Vercel:**
   - Create a Vercel account if you don't have one.
   - Install the Vercel CLI: `npm install -g vercel`.
   - Clone your forked repository: `git clone https://github.com/your-username/silly-bot-lite.git`.
   - Navigate to the project directory: `cd silly-bot-lite`.
   - Install dependencies: `npm install`.
   - Set up the environment variables in a `.env` file or configure them on the Vercel dashboard:
     - `BINANCE_US_API_KEY`: Your Binance.US API key.
     - `BINANCE_US_SECRET`: Your Binance.US API secret.
     - `DB_CONNECTION_URI`: Your MongoDB connection URI.
     - `DB_NAME`: Your MongoDB database name.
     - `DB_COLLECTION`: Your MongoDB collection name for main data.
     - `DB_TOKENS_COLLECTION`: Your MongoDB collection name for tokens.
   - Deploy the application to Vercel: `vercel`.
   - Follow the prompts to configure your deployment.

5. **Setup TradingView Alerts:**
   - Open TradingView and create an alert.
   - Set the alert to send a webhook to the URL where your application is hosted. Use the following format:
     ```
     https://your-vercel-app-url/api/webhook
     ```
     Replace `your-vercel-app-url` with the actual URL where your application is hosted.

Now, your Silly Bot Lite should be set up and ready to use.

## Testing Webhook API 🧪

You can test the webhook API using the following command from the terminal:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name": "SOL", "action": "buy", "timeframe": "1h", "tokenPrice": 69, "usdtPrice": 3963.36, "indicator": "Moving Average"}' https://application-url-here/api/webhook
```

Make sure to replace `https://application-url-here` with the actual URL where your application is hosted.

---
### Happy trading! 📈💰
