// App.js

import React, { useState, useEffect } from 'react';
import { FaHistory, FaDatabase, FaSpinner } from 'react-icons/fa';
import { GiToken } from 'react-icons/gi';
import TransactionTable from './components/TransactionTable';
import Header from './components/Header';
import ProfitTable from './components/ProfitTable';
import DbManager from './components/DbManager';
import TokenManager from './components/TokenManager';

const App = () => {
  const [data, setData] = useState([]);
  const [tokenData, setTokenData] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [currentPage, setCurrentPage] = useState('History');
  const [activeButton, setActiveButton] = useState('History');
  const [filterByName, setFilterByName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const fetchTokenData = async () => {
    try {
      const response = await fetch('/api/tokens');
      const tokenResult = await response.json();
      setTokenData(tokenResult);
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      const healthResult = await response.json();
      setHealthData(healthResult);
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTokenData();
    fetchHealthData();
  }, []);

  const handleButtonClick = (page) => {
    setCurrentPage(page);
    setActiveButton(page);
  };

  const handleFilterByNameChange = (value) => {
    setFilterByName(value);
  };

  return (
    <div className="App">
      <div className="app-container">
        <Header />
        {loading ? (
          <div className="loading-container">
            <p>Loading <FaSpinner className="loading-icon" /></p>
          </div>
        ) : (
          <>
            {data.length > 0 && (
              <div className="filter-container">
                <label htmlFor="nameFilter" style={{ color: '#f4d7d7' }}>
                  Filter by Token:{' '}
                </label>
                <select
                  id="nameFilter"
                  onChange={(e) => handleFilterByNameChange(e.target.value)}
                  value={filterByName}
                  style={{
                    backgroundColor: '#333',
                    color: 'white',
                    padding: '5px',
                    border: '1px solid #555',
                  }}
                >
                  <option value="">All Tokens</option>
                  {Array.from(new Set(data.map((item) => item.name)))
                    .sort()
                    .map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <ProfitTable data={data} selectedToken={filterByName} />
            <div>
              <button
                onClick={() => handleButtonClick('History')}
                className={activeButton === 'History' ? 'nav-button active' : 'nav-button'}
              >
                <FaHistory className="nav-icon " /> History
              </button>
              <button
                onClick={() => handleButtonClick('TokenManagement')}
                className={activeButton === 'TokenManagement' ? 'nav-button active' : 'nav-button'}
              >
                <GiToken  className="nav-icon " /> Tokens
              </button>
              <button
                onClick={() => handleButtonClick('Database')}
                className={activeButton === 'Database' ? 'nav-button active' : 'nav-button'}
              >
                <FaDatabase className="nav-icon " /> Database
              </button>
            </div>

            <div className="component-container">
              {currentPage === 'History' && (
                <TransactionTable filterByName={filterByName} data={data} />
              )}
              {currentPage === 'TokenManagement' && (
                <TokenManager tokenData={tokenData} setTokenData={setTokenData} />
              )}
              {currentPage === 'Database' && (
                <DbManager healthData={healthData} transactionData={data} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
