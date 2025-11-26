import React, { useEffect } from 'react';

const AlertNotification = ({ type = 'info', message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div 
      className={`alert alert-${type} alert-dismissible fade show`} 
      role="alert"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        minWidth: '300px',
        maxWidth: '500px',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s ease'
      }}
    >
      <strong>{getAlertIcon(type)}</strong> {message}
      <button 
        type="button" 
        className="btn-close" 
        onClick={onClose}
        aria-label="Close"
      ></button>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const getAlertIcon = (type) => {
  const icons = {
    success: '✅',
    danger: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    primary: '🔵',
    secondary: '⚪',
    light: '💡',
    dark: '⚫'
  };
  return icons[type] || 'ℹ️';
};

export default AlertNotification;