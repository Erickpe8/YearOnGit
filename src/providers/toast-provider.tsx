"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

export type ToastKind = "success" | "error" | "warning" | "info";

export type ToastInput = {
  kind: ToastKind;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = {
  notify: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = `toast_${Math.random().toString(36).slice(2, 8)}`;
    const duration = toast.durationMs ?? (toast.kind === "error" ? 7000 : 4200);
    setToasts((current) => [...current.slice(-4), { ...toast, id }]);
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              className="pointer-events-auto glass-card flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-left shadow-lg"
              role={toast.kind === "error" ? "alert" : "status"}
            >
              <span className="mt-0.5 font-display text-sm" aria-hidden>
                {toast.kind === "success"
                  ? "✓"
                  : toast.kind === "warning"
                    ? "⚠"
                    : toast.kind === "error"
                      ? "✕"
                      : "ℹ"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">{toast.title}</p>
                {toast.actionLabel && toast.onAction ? (
                  <button
                    type="button"
                    className="mt-1 text-xs font-bold text-primary"
                    onClick={() => {
                      toast.onAction?.();
                      dismiss(toast.id);
                    }}
                  >
                    {toast.actionLabel}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="text-on-surface-variant hover:text-on-surface"
                aria-label="Close"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
