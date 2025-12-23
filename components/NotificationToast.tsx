
import React, { useEffect } from 'react';
import { AppNotification } from '../types';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <ToastItem key={notif.id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notification: AppNotification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const config = {
    info: { icon: Info, color: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    success: { icon: CheckCircle2, color: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    warning: { icon: AlertTriangle, color: 'bg-amber-600', light: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    error: { icon: XCircle, color: 'bg-red-600', light: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  }[notification.type];

  const Icon = config.icon;

  return (
    <div className={`pointer-events-auto flex items-stretch overflow-hidden rounded-2xl border ${config.border} ${config.light} shadow-lg shadow-black/5 animate-in slide-in-from-right-full duration-300`}>
      <div className={`w-1.5 ${config.color}`} />
      <div className="flex-1 p-4 flex items-start gap-3">
        <div className={`mt-0.5 p-1.5 rounded-lg ${config.color} text-white`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-black uppercase tracking-tight ${config.text}`}>{notification.title}</h4>
          <p className="text-xs font-medium text-stone-600 mt-0.5 leading-tight">{notification.message}</p>
        </div>
        <button 
          onClick={() => onDismiss(notification.id)}
          className="text-stone-400 hover:text-stone-600 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
