import React, { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === 'success';

  return (
    <div className="flex items-start gap-3 bg-white border border-slate-200/80 rounded-xl p-4 shadow-toast max-w-sm w-full transition-all duration-200 animate-in fade-in slide-in-from-top-2">
      {/* Icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}
      >
        {isSuccess ? <Check className="w-4 h-4 stroke-[2.5]" /> : <AlertCircle className="w-4 h-4 stroke-[2.5]" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-sm font-semibold text-slate-900 leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-xs text-slate-500 mt-1 leading-normal">
            {toast.description}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
