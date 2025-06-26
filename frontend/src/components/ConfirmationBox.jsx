import React from 'react';
import './ConfirmationBox.css';

const ConfirmationBox = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) => {
  if (!isOpen) return null;
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-box">
        <h3 className="confirmation-title">{title}</h3>
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <button className="confirmation-cancel" onClick={onCancel}>{cancelText}</button>
          <button
            className={`confirmation-confirm${danger ? ' danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationBox;
