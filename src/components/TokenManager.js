import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaEdit, FaTimes } from 'react-icons/fa';

const TokenManager = ({ tokenData, setTokenData}) => {
  const [tokens, setTokens] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenUsdt, setNewTokenUsdt] = useState('');

  useEffect(() => {
    setTokens(tokenData);
  }, [tokenData]);

  const handleAddTokenClick = () => {
    setShowAddModal(true);
    setNewTokenName('');
    setNewTokenUsdt('');
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setNewTokenName('');
    setNewTokenUsdt('');
  };

  const handleAdd = async () => {
    if (!newTokenName || !newTokenUsdt) {
      alert('Please enter both token name and USDT amount.');
      return;
    }

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTokenName, usdtAmount: Number(newTokenUsdt) }),
      });

      if (!response.ok) {
        throw new Error('Failed to add token.');
      }      
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding token:', error);
    }

    const newToken = {
      name: newTokenName,
      usdtAmount: newTokenUsdt
    };

    setTokenData([...tokens, newToken]);

  };

  const handleEditTokenClick = (token) => {
    setSelectedToken(token);
    setNewTokenName(token.name);
    setNewTokenUsdt(token.usdtAmount);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!newTokenName || !newTokenUsdt) {
      alert('Please enter both token name and USDT amount.');
      return;
    }

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTokenName, usdtAmount: Number(newTokenUsdt) }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit token.');
      }

      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error editing token:', error);
    }

    const updatedToken = {
      name: newTokenName,
      usdtAmount: newTokenUsdt
    };
    setTokenData(tokens.map(token => token._id === selectedToken._id ? updatedToken : token));
  };

  const handleDeleteTokenClick = (token) => {
    setSelectedToken(token);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/tokens', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: selectedToken.name}),
      });

      if (!response.ok) {
        throw new Error('Failed to delete token.');
      }

      setTokenData(tokens.filter(token => token._id !== selectedToken._id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };


  const renderAddEditTokenModal = (isEditMode) => {
    if (!showAddModal && !showEditModal) return null;
  
    return (
      <div className="modal-backdrop">
        <div className="modal-content">
          <h2>{isEditMode ? 'Edit Token' : 'Add Token'}</h2>
          <p>{isEditMode ? 'Edit a Token\'s trade amount' : 'Add a Token and an amount to be used for trades'}</p>
          <div className="modal-input-container">
            <input
              type="text"
              placeholder="Token Name"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              disabled={isEditMode}
            />
            <input
              type="number"
              placeholder="USDT Amount"
              value={newTokenUsdt}
              onChange={(e) => setNewTokenUsdt(e.target.value)}
            />
          </div>
          <div>
            <button className="action-button" onClick={isEditMode ? handleEdit : handleAdd}>{isEditMode ? 'Confirm' : 'Add'}</button>
            <button className="action-button" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteTokenModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="modal-backdrop">
        <div className="modal-content">
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to remove {selectedToken?.name} amount?</p>
          <div>
            <button className="action-button" onClick={handleDelete}>Confirm</button>
            <button className="action-button" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };


  const renderTableOrMessage = () => {

    if (tokens.length === 0) {
      return (
        <div className="message">
          <div className="warning-container">
            <FaExclamationTriangle className="warning-icon" />
            <p>Trades will use full token balance</p>
          </div>
        </div> 
      );
    }

    return (
      <div className="token-table-container">
        <div className="table-scroll">
          <table className="token-table">
            <thead>
            <tr>
              <th style={{ color: '#f4d7d7'}}>Name</th>
              <th style={{ color: '#f4d7d7'}}>USDT Amount</th>
              <th style={{ color: '#f4d7d7'}}>Edit</th>
              <th style={{ color: '#f4d7d7'}}>Delete</th>
            </tr>
            </thead>
            <tbody>
            {tokens.map((token, index) => (
              <tr key={`${token.name}_${index}`}>
                  <td>{token.name}</td>
                  <td>{token.usdtAmount}</td>
                  <td onClick={() => handleEditTokenClick(token)}><FaEdit className="fa-edit"/></td>
                  <td onClick={() => handleDeleteTokenClick(token)}><FaTimes className="fa-times"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h2>Token Management</h2>
      <button className="action-button" onClick={handleAddTokenClick}>
          Add Token
      </button>
      {renderAddEditTokenModal(showEditModal)}
      {renderDeleteTokenModal()}
      {renderTableOrMessage()}
    </div>
  );
};

export default TokenManager;
