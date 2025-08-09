// types/Notification.ts - NUEVO ARCHIVO DE TIPOS
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type NotificationPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  position?: NotificationPosition;
  showClose?: boolean;
  autoClose?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}