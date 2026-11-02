import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, action?: { label: string; onClick: () => void }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message, action }]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, action?: { label: string; onClick: () => void }) => {
    showToast('error', title, message, action);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border-2 shadow-brutal transition-all animate-fadeIn ${
              t.type === 'success'
                ? 'bg-white dark:bg-[#1E1E1E] border-google-green text-google-dark dark:text-white'
                : t.type === 'error'
                ? 'bg-white dark:bg-[#1E1E1E] border-google-red text-google-dark dark:text-white'
                : 'bg-white dark:bg-[#1E1E1E] border-google-blue text-google-dark dark:text-white'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-google-green" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-google-red" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-google-yellow" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-google-blue" />}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="font-extrabold text-xs sm:text-sm leading-snug">{t.title}</h5>
              {t.message && (
                <p className="text-xs text-google-grey dark:text-gray-400 mt-0.5 leading-relaxed">{t.message}</p>
              )}
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    removeToast(t.id);
                  }}
                  className="mt-2 px-3 py-1 bg-google-red text-white text-[11px] font-black rounded-lg border border-google-dark hover:bg-red-600 transition"
                >
                  {t.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-gray-400 hover:text-google-dark dark:hover:text-white transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      showToast: (type: ToastType, title: string, message?: string) => console.log(`[Toast ${type}] ${title}: ${message}`),
      showSuccess: (title: string, message?: string) => console.log(`[Toast success] ${title}: ${message}`),
      showError: (title: string, message?: string) => console.error(`[Toast error] ${title}: ${message}`)
    };
  }
  return ctx;
}
