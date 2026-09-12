import React, { useEffect, useState } from 'react';
import { toast, ToastMessage } from '../../utils/errors';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((msg) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 5000);
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-teal-600 shrink-0" />,
        };

        const bgStyles = {
          success: 'bg-white border-emerald-200 text-slate-800 shadow-lg',
          error: 'bg-white border-red-200 text-slate-800 shadow-lg',
          warning: 'bg-white border-amber-200 text-slate-800 shadow-lg',
          info: 'bg-white border-teal-200 text-slate-800 shadow-lg',
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-sm ${bgStyles[t.type]} transition-all animate-in slide-in-from-bottom-2`}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs tracking-wide uppercase text-slate-500 mb-0.5">{t.title}</div>
              <div className="text-slate-800 leading-snug">{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
