import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const TOAST_EVENT = "photometrics-toast";

const ToastContext = createContext({ notify: () => {} });

function getToneClasses(type) {
    if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
    if (type === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
    return "border-red-200 bg-red-50 text-red-900";
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback((toast) => {
        const id = toast.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const nextToast = {
            id,
            type: toast.type || "error",
            title: toast.title || "Something went wrong",
            message: toast.message || "Please try again.",
        };

        setToasts((currentToasts) => [nextToast, ...currentToasts].slice(0, 4));
        window.setTimeout(() => removeToast(id), toast.durationMs || 7000);
        return id;
    }, [removeToast]);

    useEffect(() => {
        const handleToast = (event) => notify(event.detail || {});
        window.addEventListener(TOAST_EVENT, handleToast);
        return () => window.removeEventListener(TOAST_EVENT, handleToast);
    }, [notify]);

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`rounded-2xl border p-4 shadow-lg ${getToneClasses(toast.type)}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm font-black">{toast.title}</div>
                                <div className="mt-1 text-sm opacity-90">{toast.message}</div>
                            </div>
                            <button
                                type="button"
                                className="rounded-full px-2 text-lg leading-none opacity-70 hover:opacity-100"
                                aria-label="Dismiss notification"
                                onClick={() => removeToast(toast.id)}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
