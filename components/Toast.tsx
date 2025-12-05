import React, { useEffect } from 'react';
import { X, Bell, MessageCircle, Heart, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'message';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-brand-400" />;
      default: return <Bell className="w-5 h-5 text-brand-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-green-500/50';
      case 'error': return 'border-red-500/50';
      default: return 'border-brand-500/50';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-start gap-3 bg-zinc-900/90 backdrop-blur-md border ${getBorderColor()} p-4 rounded-2xl shadow-2xl min-w-[320px] max-w-sm animate-in slide-in-from-top-5 fade-in duration-300`}>
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <h4 className="font-bold text-white text-sm">{toast.title}</h4>
        <p className="text-zinc-300 text-sm mt-0.5 line-clamp-2">{toast.message}</p>
      </div>
      <button 
        onClick={() => onClose(toast.id)}
        className="text-zinc-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};