// Toast.tsx - Sistema de notificaciones moderno
import { useState, useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

export function Toast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast, onClose]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
        }
    };

    return (
        <div className={`toast toast-${toast.type}`}>
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-message">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={onClose}>
                ×
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Hook para usar toasts fácilmente
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastType, title: string, message: string, duration?: number) => {
        const id = Date.now().toString() + Math.random().toString(36);
        const newToast: ToastMessage = { id, type, title, message, duration };
        setToasts((prev) => [...prev, newToast]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const success = (title: string, message: string) => addToast('success', title, message);
    const error = (title: string, message: string) => addToast('error', title, message);
    const warning = (title: string, message: string) => addToast('warning', title, message);
    const info = (title: string, message: string) => addToast('info', title, message);

    return {
        toasts,
        removeToast,
        success,
        error,
        warning,
        info,
    };
}
