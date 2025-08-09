// components/core/Notifications/NotificationItem.tsx
import React, { useEffect, useState } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { Notification } from '../../../types/Notification';

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { removeNotification } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  const getNotificationStyles = () => {
    const baseStyles = "relative p-4 rounded-xl border-0 transition-all duration-300 transform ";
    const visibilityStyles = isVisible 
      ? "translate-x-0 opacity-100 scale-100" 
      : "translate-x-full opacity-0 scale-95";
    
    const leavingStyles = isLeaving 
      ? "translate-x-full opacity-0 scale-95" 
      : "";

    // Sombras modernas
    const shadowStyles = "shadow-lg shadow-black/10 ";

    switch (notification.type) {
      case 'success':
        return baseStyles + shadowStyles + "bg-gradient-to-r from-green-50 to-green-100 text-green-800 " + visibilityStyles + " " + leavingStyles;
      case 'error':
        return baseStyles + shadowStyles + "bg-gradient-to-r from-red-50 to-red-100 text-red-800 " + visibilityStyles + " " + leavingStyles;
      case 'warning':
        return baseStyles + shadowStyles + "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 " + visibilityStyles + " " + leavingStyles;
      case 'info':
        return baseStyles + shadowStyles + "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 " + visibilityStyles + " " + leavingStyles;
      default:
        return baseStyles + shadowStyles + "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 " + visibilityStyles + " " + leavingStyles;
    }
  };

  const getIcon = () => {
    const iconClass = "text-xl flex-shrink-0";
    switch (notification.type) {
      case 'success':
        return <i className={`bi bi-check-circle-fill text-green-500 ${iconClass}`}></i>;
      case 'error':
        return <i className={`bi bi-x-circle-fill text-red-500 ${iconClass}`}></i>;
      case 'warning':
        return <i className={`bi bi-exclamation-triangle-fill text-yellow-500 ${iconClass}`}></i>;
      case 'info':
        return <i className={`bi bi-info-circle-fill text-blue-500 ${iconClass}`}></i>;
      default:
        return <i className={`bi bi-bell-fill text-gray-500 ${iconClass}`}></i>;
    }
  };

  return (
    <div className={getNotificationStyles()}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1 leading-tight">
            {notification.title}
          </h4>
          <p className="text-sm opacity-90 leading-relaxed">
            {notification.message}
          </p>
        </div>
      </div>

      {/* Punto de progreso moderno minimalista */}
      {notification.autoClose && notification.duration && (
        <div className="absolute top-3 right-3">
          <button
            onClick={handleClose}
            className="group relative w-2 h-2 rounded-full bg-current opacity-40 hover:opacity-70 transition-all duration-200 hover:scale-125"
            style={{
              animation: `modern-pulse 3s ease-in-out infinite, modern-fade ${notification.duration}ms linear forwards`
            }}
          >
            {/* Efecto de onda al hover */}
            <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300"></div>
          </button>
        </div>
      )}

      {/* Botón de cierre manual (más grande) */}
      {notification.showClose && !notification.autoClose && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center transition-all duration-200 group"
        >
          <i className="bi bi-x text-sm opacity-40 group-hover:opacity-70 transition-opacity"></i>
        </button>
      )}
    </div>
  );
};

export default NotificationItem;