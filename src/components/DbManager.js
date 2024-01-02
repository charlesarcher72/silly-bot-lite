// DbManager.js
import React, { useState, useEffect } from 'react';

const DbManager = ({healthData, transactionData}) => {
  const [uniqueNames, setUniqueNames] = useState([]);
  const [selectedName, setSelectedName] = useState('All');

  useEffect(() => {
    const names = Array.from(new Set(transactionData.map((entry) => entry.name)));
    setUniqueNames(names);
  }, []);

  const handleClearHistory = async () => {
    if (selectedName === '') {
      window.alert('Please select a token or "All" from the dropdown.');
      return;
    }
    let confirmation = "";
    if (selectedName === 'All') {
      confirmation = window.confirm(`Are you sure you want to delete all transactions from the database?`);
    } else {
      confirmation = window.confirm(`Are you sure you want to delete all ${selectedName} transactions from the database?`);
    }

    if (confirmation) {
      try {
        // Make a DELETE request to clear token history for the selected name
        const response = await fetch(`/api/data?name=${selectedName}`, {
          method: 'DELETE',
        });

        // Check if the request was successful
        if (response.ok) {
          console.log(`Token history cleared for ${selectedName}`);

          // Set name back to all
          setSelectedName("All")

        } else {
          console.error(`Failed to clear token history for ${selectedName}`);
        }
      } catch (error) {
        console.error('Error clearing token history:', error);
      }
    }
  };

  const handlePopulateTestData = async () => {
    try {
      // Make a PUT request to add test data to the database
      const response = await fetch('/api/data', {
        method: 'PUT',
      });

      // Check if the request was successful
      if (response.ok) {
        console.log('Test data populated');
      } else {
        console.error('Failed to populate test data');
      }
    } catch (error) {
      console.error('Error populating test data:', error);
    }
  };

  return (
    <div className="container">
      <div className="db-manager-component">
        <h2 className="db-manager-header">Database Management</h2>
          <div className="database-manager-row-container">
            <label htmlFor="nameDropdown" style={{ color: '#f4d7d7' }}>
              Select Token:{' '}
            </label>
            <select
              id="nameDropdown"
              onChange={(e) => setSelectedName(e.target.value)}
              value={selectedName}
                style={{
                  backgroundColor: '#333',
                  color: 'white',
                  padding: '5px',
                  border: '1px solid #555',
              }}
             >
              <option value="All">All</option>
                {uniqueNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </select>
            <button className="action-button" onClick={handleClearHistory}>
              Clear History
            </button>
          </div>
          <div className="database-manager-row-container">
            <table>
              <thead>
                <tr>
                  <th style={{ color: '#f4d7d7', width: '10%' }}>Status</th>
                  <th style={{ color: '#f4d7d7', width: '10%' }}>Items</th>
                  <th style={{ color: '#f4d7d7', width: '20%' }}>Connections</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: healthData.databaseStatus === "Connected" ? '#34de00' : '#f5050d' }}>{healthData.databaseStatus}</td>
                  <td>{healthData.itemCount}</td>
                  <td>{healthData.connections}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="database-manager-row-container">
            <button className="action-button" onClick={handlePopulateTestData}>
              Send Test Data
            </button>
          </div>
      </div>
    </div>
  );
};


export default DbManager;