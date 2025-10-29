import React, { useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) => {
  // Keyboard event handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-500',
          confirmBg: 'bg-red-500 hover:bg-red-600',
          icon: <FiAlertTriangle className="w-6 h-6" />
        };
      case 'info':
        return {
          iconColor: 'text-blue-500',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          icon: <FiAlertTriangle className="w-6 h-6" />
        };
      default: // warning
        return {
          iconColor: 'text-yellow-500',
          confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
          icon: <FiAlertTriangle className="w-6 h-6" />
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className={`${styles.iconColor}`}>
              {styles.icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>
        
        <div className="modal-body">
          <p className="text-gray-600 leading-relaxed">{message}</p>
          <div className="text-xs text-gray-400 mt-3">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to confirm or <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to cancel
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${styles.confirmBg} text-white`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
