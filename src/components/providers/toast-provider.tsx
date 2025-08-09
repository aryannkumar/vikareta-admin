'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove toast after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      className={`
        bg-white border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 min-w-80 max-w-md
        animate-in slide-in-from-right-full duration-300
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-gray-500">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}