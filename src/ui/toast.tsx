import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; run: () => void };
}

interface ToastApi {
  notify(message: string, options?: { tone?: ToastTone; action?: Toast['action'] }): void;
}

const ToastContext = createContext<ToastApi>({ notify: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      notify(message, options) {
        const id = nextId.current++;
        const toast: Toast = { id, message, tone: options?.tone ?? 'info', action: options?.action };
        setToasts((list) => [...list.slice(-3), toast]);
        setTimeout(() => dismiss(id), toast.tone === 'error' ? 8000 : 5000);
      },
    }),
    [dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast-${t.tone}`}>
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="ui-toast-action"
                onClick={() => {
                  t.action?.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="ui-icon-btn" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
