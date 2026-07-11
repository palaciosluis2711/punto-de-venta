import React, { useRef } from 'react';
import { Button } from '../../../shared/components/Button';
import { ReceiptPreview } from '../../sales/components/ReceiptPreview';
import { useTicketSettings } from '../../settings/hooks/useTicketSettings';
import type { Sale } from '../../sales/types';
import { Printer, CheckCircle, ArrowRight, Ticket } from 'lucide-react';
import { createPortal } from 'react-dom';

import './PostSaleView.css';

interface PostSaleViewProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    isHistoryView?: boolean;
}

export const PostSaleView: React.FC<PostSaleViewProps> = ({ isOpen, onClose, sale, isHistoryView = false }) => {
    const { settings } = useTicketSettings();
    const componentRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !sale) return null;

    const handlePrint = () => {
        window.print();
    };

    return createPortal(
        <div className="post-sale-overlay">
            <div className="post-sale-container animate-in">
                
                {/* Success Header */}
                <div className="post-sale-header no-print">
                    <div className="success-icon-wrapper">
                        {isHistoryView ? <Ticket size={40} className="success-icon text-primary" /> : <CheckCircle size={40} className="success-icon" />}
                    </div>
                    <h2 className="success-title">{isHistoryView ? 'Reimprimir Ticket' : 'Venta Finalizada'}</h2>
                    <p className="success-subtitle">
                        {isHistoryView ? 'Previsualización del ticket de esta venta.' : 'La transacción se completó correctamente.'}
                    </p>
                </div>

                {/* Ticket Preview Box */}
                <div className="ticket-preview-box">
                    <ReceiptPreview
                        ref={componentRef}
                        sale={sale}
                        settings={settings}
                        width={settings.printerWidth}
                    />
                </div>

                {/* Actions */}
                <div className="post-sale-actions no-print">
                    <Button
                        variant="secondary"
                        icon={<Printer size={18} />}
                        onClick={handlePrint}
                        className="btn-print"
                    >
                        Imprimir Ticket
                    </Button>

                    <Button
                        variant="primary"
                        icon={isHistoryView ? undefined : <ArrowRight size={18} />}
                        onClick={onClose}
                        className="btn-new-sale"
                    >
                        {isHistoryView ? 'Cerrar' : 'Nueva Venta'}
                    </Button>
                </div>

            </div>
        </div>,
        document.body
    );
};

