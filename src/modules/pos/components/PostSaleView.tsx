import React, { useRef } from 'react';
import { Button } from '../../../shared/components/Button';
import { ReceiptPreview } from '../../sales/components/ReceiptPreview';
import { useTicketSettings } from '../../settings/hooks/useTicketSettings';
import type { Sale } from '../../sales/types';
import { Printer, CheckCircle, ArrowRight } from 'lucide-react';

import './PostSaleView.css';

interface PostSaleViewProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}

export const PostSaleView: React.FC<PostSaleViewProps> = ({ isOpen, onClose, sale }) => {
    const { settings } = useTicketSettings();
    const componentRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !sale) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center post-sale-view overflow-y-auto py-10"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', zIndex: 100 }}
        >
            <div className="flex flex-col items-center gap-6 max-w-md w-full">
                {/* Header Content */}
                <div className="flex flex-col items-center gap-3 text-center no-print">
                    <div className="rounded-full bg-green-100 p-3 text-green-600 shadow-sm">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2" style={{ paddingBottom: '0.50rem' }}>Venta Finalizada</h2>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Printer size={16} />}
                            onClick={handlePrint}
                            className="shadow-sm hover:bg-gray-200 text-sm font-medium border border-gray-200"
                        >
                            Imprimir Ticket
                        </Button>
                    </div>
                </div>

                {/* Ticket Preview */}
                <div
                    className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-100 ring-1 ring-black/5 w-full"
                    style={{ paddingTop: '1rem', maxHeight: '70vh', overflowY: 'auto' }}
                >
                    <ReceiptPreview
                        ref={componentRef}
                        sale={sale}
                        settings={settings}
                        width={settings.printerWidth}
                    />
                </div>

                {/* New Sale Button */}
                <div className="post-sale-new-sale-container"
                    style={{ paddingTop: '1rem' }}>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight size={16} />}
                        onClick={onClose}
                        className="shadow-md text-sm font-medium min-w-[150px]"
                    >
                        Nueva Venta
                    </Button>
                </div>
            </div>
        </div>
    );
};

