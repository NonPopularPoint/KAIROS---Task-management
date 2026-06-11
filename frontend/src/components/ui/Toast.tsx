"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const configs: Record<ToastType, { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", Icon: CheckCircle2 },
  error: { bg: "bg-coral-50", border: "border-coral-200", text: "text-coral-800", Icon: XCircle },
  info: { bg: "bg-kairos-50", border: "border-kairos-200", text: "text-kairos-800", Icon: Info },
};

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);

    if (type !== "error") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const cfg = configs[t.type];
            return (
              <motion.div
                key={t.id}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg ${cfg.bg} ${cfg.border}`}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
              >
                <cfg.Icon size={18} className={`${cfg.text} shrink-0 mt-0.5`} />
                <p className={`text-sm ${cfg.text} flex-1`}>{t.message}</p>
                <button onClick={() => remove(t.id)} className={`${cfg.text} hover:opacity-70 shrink-0`}>
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
