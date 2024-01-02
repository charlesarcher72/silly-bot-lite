import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const formatDateTime = (datetime) => {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  return new Date(datetime).toLocaleString('en-US', options);
};

const calculateRowColor = (data, item, index) => {
  const currentAction = item.action;
  const itemName = item.name;

  const nextItems = data.slice(index + 1);
  const nextBuy = nextItems.find(
    (nextItem) => nextItem.name === itemName
  );

  if (currentAction === 'sell') {
    if (!nextBuy || nextBuy.action === 'sell') {
      return 'rgba(255, 255, 0, 0.2)';
    }

    const nextBuyUsdtValue = nextBuy.usdtPrice;
    const currentUsdtValue = item.usdtPrice;

    if (currentUsdtValue > nextBuyUsdtValue) {
      return 'rgba(0, 255, 0, 0.2)';
    }
    return 'rgba(255, 0, 0, 0.2)';
  }

  return 'transparent';
};

const TransactionTable = ({ filterByName, data}) => {

  const filteredData = filterByName
    ? data.filter((item) => item.name === filterByName)
    : data;

  const renderTableOrMessage = () => {

    if (data.length === 0) {
      return (
        <div className="warning-container">
          <FaExclamationTriangle className="warning-icon" />
          <p>No transactions are present in the database.</p>
        </div>
      );
    }

    return (
      <div className="table-scroll">
        <table className="transaction-table">
          <thead>
            <tr>
              <th style={{ color: '#f4d7d7', width: '10%' }}>Token</th>
              <th style={{ color: '#f4d7d7', width: '5%' }}>Action</th>
              <th style={{ color: '#f4d7d7', width: '5%' }}>Timeframe</th>
              <th style={{ color: '#f4d7d7', width: '15%' }}>Price</th>
              <th style={{ color: '#f4d7d7', width: '15%' }}>USDT</th>
              <th style={{ color: '#f4d7d7', width: '15%' }}>Amount</th>
              <th style={{ color: '#f4d7d7', width: '30%' }}>DateTime</th>
              <th style={{ color: '#f4d7d7', width: '20%' }}>Indicator</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item._id} style={{ backgroundColor: calculateRowColor(filteredData, item, index) }}>
                <td>{item.name}</td>
                <td>{item.action}</td>
                <td>{item.timeframe}</td>
                <td>{item.tokenPrice}</td>
                <td>{parseFloat(item.usdtPrice).toFixed(2)}</td>
                <td>{(parseFloat(item.usdtPrice) / parseFloat(item.tokenPrice)).toFixed(2)}</td>
                <td>{formatDateTime(item.datetime)}</td>
                <td>{item.indicator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="transaction-table-container">
        <h2>Transaction History</h2>
        {renderTableOrMessage()}
      </div>
    </div>
  );
};

export default TransactionTable;
