import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { ToastInput, ToastItem, ToastVariant } from './types';

interface ToastContextValue {
  showToast: (input: ToastInput) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4500,
  info: 4500,
  error: 7000,
};

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; classes: string; iconClasses: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'border-brand-200 bg-brand-50',
    iconClasses: 'text-brand-700',
  },
  error: {
    icon: XCircle,
    classes: 'border-red-200 bg-red-50',
    iconClasses: 'text-red-600',
  },
  info: {
    icon: Info,
    classes: 'border-blue-200 bg-blue-50',
    iconClasses: 'text-blue-600',
  },
};

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `toast-${idCounter}-${Date.now()}`;
}

/**
 * App-wide toast system — no external dependency, reuses the framer-motion
 * and lucide-react already in the project. Mounted once near the app root;
 * anywhere in the tree can call `useToast()` to surface success/error
 * feedback for a completed action.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = nextId();
      const duration = input.duration ?? DEFAULT_DURATION[input.variant];
      setToasts((prev) => [...prev, { ...input, id }]);
      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast({ variant: 'success', title, message }),
    [showToast]
  );
  const showError = useCallback(
    (title: string, message?: string) => showToast({ variant: 'error', title, message }),
    [showToast]
  );

  const value = useMemo(
    () => ({ showToast, showSuccess, showError, dismissToast }),
    [showToast, showSuccess, showError, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = VARIANT_STYLES[toast.variant];
            const Icon = style.icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${style.classes}`}
                role="status"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClasses}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                  {toast.message && <p className="mt-0.5 text-xs text-gray-600">{toast.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-black/5 hover:text-gray-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
