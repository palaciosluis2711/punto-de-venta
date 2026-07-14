import React, { createContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastSettings {
    animation: 'slide-smooth' | 'fade' | 'none';
    opacity: number;
    color: 'default' | 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'black';
}

const defaultSettings: ToastSettings = {
    animation: 'slide-smooth',
    opacity: 1.0,
    color: 'default'
};

export interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    settings: ToastSettings;
    updateSettings: (newSettings: ToastSettings) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean; id: number } | null>(null);
    const [settings, setSettings] = useState<ToastSettings>(() => {
        const saved = localStorage.getItem('app_toast_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    const updateSettings = useCallback((newSettings: ToastSettings) => {
        setSettings(newSettings);
        localStorage.setItem('app_toast_settings', JSON.stringify(newSettings));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToast({ message, type, visible: true, id });
        
        // Hide after 3 seconds
        setTimeout(() => {
            setToast(prev => (prev && prev.id === id) ? { ...prev, visible: false } : prev);
        }, 3000);
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={20} />;
            case 'error': return <AlertTriangle size={20} />;
            case 'info': return <Info size={20} />;
        }
    };

    const getThemeStyles = (type: ToastType, color: ToastSettings['color']) => {
        let baseBg = '';
        
        if (color === 'default') {
            switch (type) {
                case 'success': baseBg = 'var(--success, #10b981)'; break;
                case 'error': baseBg = 'var(--danger, #ef4444)'; break;
                case 'info': baseBg = 'var(--primary, #3b82f6)'; break;
            }
        } else {
            switch (color) {
                case 'blue': baseBg = '#3b82f6'; break;
                case 'green': baseBg = '#10b981'; break;
                case 'red': baseBg = '#ef4444'; break;
                case 'purple': baseBg = '#8b5cf6'; break;
                case 'orange': baseBg = '#f97316'; break;
                case 'black': baseBg = '#1e293b'; break;
                default: baseBg = '#3b82f6';
            }
        }

        return {
            backgroundColor: baseBg,
            color: '#fff',
            border: 'none'
        };
    };

    const renderToast = () => {
        if (!toast) return null;

        const visible = toast.visible;
        const themeStyles = getThemeStyles(toast.type, settings.color);

        let finalOpacity = visible ? settings.opacity : 0;
        let transform = 'none';
        let transition = 'none';

        if (settings.animation === 'slide-smooth') {
            transform = visible ? 'translateX(0)' : 'translateX(150%)';
            transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        } else if (settings.animation === 'fade') {
            transition = 'opacity 0.3s ease-in-out';
        }

        if (settings.animation === 'none') {
            finalOpacity = settings.opacity;
            if (!visible) return null; // Unmount immediately
        }

        return createPortal(
            <div 
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    zIndex: 9999,
                    fontWeight: '500',
                    ...themeStyles,
                    opacity: finalOpacity,
                    transform,
                    transition
                }}
            >
                {getIcon(toast.type)}
                {toast.message}
            </div>,
            document.body
        );
    };

    return (
        <ToastContext.Provider value={{ showToast, settings, updateSettings }}>
            {children}
            {renderToast()}
        </ToastContext.Provider>
    );
};
