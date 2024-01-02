import React, { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

const ProfitTable = ({ data, selectedToken }) => {
  const calculateProfits = () => {
    const nameProfits = {};
    let totalProfit = 0;

    // Group transactions by name
    const groupedByName = data.reduce((acc, transaction) => {
      const { name, action, datetime, usdtPrice } = transaction;

      if (!acc[name]) {
        acc[name] = [];
      }

      acc[name].push({ action, datetime, usdtPrice });

      return acc;
    }, {});

    // Calculate profits for each name
    Object.keys(groupedByName).forEach((name) => {
      if (selectedToken && name !== selectedToken) {
        return; // Skip entries not matching the selectedToken
      }

      const transactions = groupedByName[name];

      // Sort transactions by datetime in ascending order
      transactions.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      let mostRecentTransaction = null;

      transactions.forEach((transaction) => {
        if (transaction.action === 'buy') {
          totalBuyAmount += transaction.usdtPrice;
          mostRecentTransaction = 'buy';
        } else if (transaction.action === 'sell') {
          totalSellAmount += transaction.usdtPrice;
          mostRecentTransaction = 'sell';
        }
      });

      // If the most recent transaction is a buy, subtract it from the total buy amount
      if (mostRecentTransaction === 'buy') {
        totalBuyAmount -= transactions[transactions.length - 1].usdtPrice;
      }

      // Calculate profit for the name
      const profit = totalSellAmount - totalBuyAmount;
      totalProfit += profit;

      // Store profit for the name
      nameProfits[name] = { profit };
    });

    return { nameProfits, totalProfit };
  };

  const calculateTotalProfitPercentage = (totalProfit, data) => {
    const uniqueNames = [...new Set(data.map((transaction) => transaction.name))];

    const totalFirstBuyAmount = uniqueNames.reduce((acc, name) => {
      const firstBuyAmount = data
        .filter((transaction) => transaction.name === name && transaction.action === 'buy')
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))[0]?.usdtPrice || 1;

      return acc + firstBuyAmount;
    }, 0);

    // Protect against divide by zero
    const totalProfitPercentage = totalFirstBuyAmount !== 0 ? (totalProfit / totalFirstBuyAmount) * 100 : 0;

    return totalProfitPercentage.toFixed(2);
  };

  const calculateProfitPercentage = (name, profits, data) => {
    const firstBuyAmount = data
      .filter((transaction) => transaction.name === name && transaction.action === 'buy')
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))[0]?.usdtPrice || 1;

    // Protect against divide by zero
    const profitPercentage = firstBuyAmount !== 0 ? (profits[name].profit / firstBuyAmount) * 100 : 0;

    return profitPercentage.toFixed(2);
  };

  const [profits, setProfits] = useState(null);

  useEffect(() => {
    setProfits(calculateProfits());
  }, [data, selectedToken]);

  if (!profits) {
    // Return loading state or null until profits are calculated
    return (
      <div className="loading-container">
        <p>Loading Profits <FaSpinner className="loading-icon" /></p>
      </div>
    );
  }

  return (
    <div className="profit-table-container">
      <table className="profit-table" style={{ tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          <col style={{ width: '33%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '33%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ color: '#f4d7d7' }}>Token</th>
            <th style={{ color: '#f4d7d7' }}>Profit</th>
            <th style={{ color: '#f4d7d7' }}>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {selectedToken === '' && (
            <tr style={{ background: '#444' }}>
              <td>TOTAL</td>
              <td
                style={{
                  color:
                    profits.totalProfit < 0
                      ? '#f5050d'
                      : profits.totalProfit > 0
                      ? '#34de00'
                      : 'white',
                }}
              >
                {profits.totalProfit.toFixed(2)}
              </td>
              <td
                style={{
                  color:
                    profits.totalProfit < 0
                      ? '#f5050d'
                      : profits.totalProfit > 0
                      ? '#34de00'
                      : 'white',
                }}
              >
                {calculateTotalProfitPercentage(profits.totalProfit, data)}%
              </td>
            </tr>
          )}
          {Object.keys(profits.nameProfits).map((name) => (
            <tr
              key={name}
              style={{
                display: selectedToken === name ? 'table-row' : 'none',
              }}
            >
              <td>{name}</td>
              <td
                style={{
                  color:
                    profits.nameProfits[name].profit < 0
                      ? '#f5050d'
                      : profits.nameProfits[name].profit > 0
                      ? '#34de00'
                      : 'white',
                }}
              >
                {profits.nameProfits[name].profit.toFixed(2)}
              </td>
              <td
                style={{
                  color:
                    profits.nameProfits[name].profit < 0
                      ? '#f5050d'
                      : profits.nameProfits[name].profit > 0
                      ? '#34de00'
                      : 'white',
                }}
              >
                {calculateProfitPercentage(name, profits.nameProfits, data)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfitTable;
