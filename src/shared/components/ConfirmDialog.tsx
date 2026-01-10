import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title}>
            <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--error)'
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {message}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Button variant="outline" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
