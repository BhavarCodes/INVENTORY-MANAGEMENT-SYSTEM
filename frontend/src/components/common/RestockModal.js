import React, { useState, useEffect, useCallback } from 'react';
import { FiPackage } from 'react-icons/fi';

const RestockModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName = "",
  title = "Restock Product", 
  confirmText = "OK", 
  cancelText = "Cancel"
}) => {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = useCallback(() => {
    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }
    setError('');
    onConfirm(qty);
    setQuantity('');
  }, [quantity, onConfirm]);

  const handleClose = useCallback(() => {
    setQuantity('');
    setError('');
    onClose();
  }, [onClose]);

  // Keyboard event handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose, handleConfirm]);

  if (!isOpen) return null;

  

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="text-green-500">
              <FiPackage className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>
        
        <div className="modal-body">
          {productName && (
            <p className="text-gray-600 mb-3">Product: <strong>{productName}</strong></p>
          )}
          <label className="form-label">Enter restock quantity:</label>
          <input
            type="number"
            className="form-control"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (error) setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter quantity"
            min="1"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="text-xs text-gray-400 mt-3">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to confirm or <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to cancel
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn bg-green-500 hover:bg-green-600 text-white"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestockModal;