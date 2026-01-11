import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransfers } from './hooks/useTransfers';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { Plus, ArrowRightLeft, Eye, Printer, RotateCcw, Edit } from 'lucide-react';
import type { Transfer } from './types';
import './TransfersPage.css';

export const TransfersPage: React.FC = () => {
    const { transfers, updateTransfer } = useTransfers();
    const { updateStockBulk } = useInventory();
    const navigate = useNavigate();

    const [viewingTransfer, setViewingTransfer] = useState<Transfer | null>(null);
    const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);

    // Ref for printing content
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current) return;
        window.print();
    };

    const handleRevertClick = () => {
        setIsRevertConfirmOpen(true);
    };

    const confirmRevert = () => {
        if (!viewingTransfer) return;

        // Revert Stock
        // For a transfer:
        // Original action was: -Source, +Dest
        // Revert action is: +Source, -Dest
        const movements: any[] = [];

        console.log("Reverting Transfer:", viewingTransfer);

        viewingTransfer.items.forEach(item => {
            const qty = Number(item.quantity);

            // Add back to source
            console.log(`Revert: Adding ${qty} back to Source ${viewingTransfer.sourceStoreId}`);
            movements.push({
                productId: item.productId,
                storeId: viewingTransfer.sourceStoreId,
                quantity: qty
            });

            // Remove from destination
            console.log(`Revert: Removing ${qty} from Destination ${viewingTransfer.destinationStoreId}`);
            movements.push({
                productId: item.productId,
                storeId: viewingTransfer.destinationStoreId,
                quantity: -qty
            });
        });

        updateStockBulk(movements);

        // Update Status
        updateTransfer(viewingTransfer.id, { status: 'cancelled' });

        // Update local state to reflect change immediately in modal
        setViewingTransfer({ ...viewingTransfer, status: 'cancelled' });
        setIsRevertConfirmOpen(false);
    };

    return (
        <div className="transfers-page animate-in">
            <div className="transfers-header">
                <div>
                    <h1 className="transfers-title">
                        <ArrowRightLeft className="text-primary" />
                        Transferencias
                    </h1>
                    <p className="transfers-subtitle">Gestiona el movimiento de inventario entre tiendas.</p>
                </div>
                <Button onClick={() => navigate('/transfers/new')} icon={<Plus size={20} />}>
                    Nueva Transferencia
                </Button>
            </div>

            <div className="transfers-table-container">
                <div className="transfers-table-wrapper">
                    <table className="transfers-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th className="table-cell-right">Valor Total</th>
                                <th className="table-cell-center">Estado</th>
                                <th className="table-cell-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay transferencias registradas.
                                    </td>
                                </tr>
                            ) : (
                                transfers.map((transfer) => (
                                    <tr
                                        key={transfer.id}
                                        onClick={() => setViewingTransfer(transfer)}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <td>{new Date(transfer.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className="badge-store">
                                                {transfer.sourceStoreName}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge-store">
                                                {transfer.destinationStoreName}
                                            </span>
                                        </td>
                                        <td className="table-cell-right" style={{ fontWeight: 500 }}>
                                            ${transfer.totalValue.toFixed(2)}
                                        </td>
                                        <td className="table-cell-center">
                                            <span className={`badge-status ${transfer.status}`}>
                                                {transfer.status === 'completed' ? 'Completado' : 'Cancelado'}
                                            </span>
                                        </td>
                                        <td className="table-cell-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={<Eye size={16} />}
                                                    title="Ver Detalles"
                                                    onClick={() => setViewingTransfer(transfer)}
                                                />
                                                {transfer.status === 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Edit size={16} />}
                                                        title="Editar Transferencia"
                                                        onClick={() => navigate(`/transfers/edit/${transfer.id}`)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={!!viewingTransfer}
                onClose={() => setViewingTransfer(null)}
                title="Detalle de Transferencia"
            >
                {viewingTransfer && (
                    <div className="transfer-details-content">
                        {/* Printable Area */}
                        <div ref={printRef} className="printable-area">
                            <div className="details-header mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Orden de Transferencia</h3>
                                        <p className="text-muted text-sm">ID: {viewingTransfer.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{new Date(viewingTransfer.date).toLocaleDateString()}</p>
                                        <span className={`badge-status ${viewingTransfer.status}`}>
                                            {viewingTransfer.status === 'completed' ? 'Completado' : 'Cancelado'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-muted">Origen</p>
                                        <p className="font-medium p-2 bg-muted/10 rounded border border-border">{viewingTransfer.sourceStoreName}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-muted">Destino</p>
                                        <p className="font-medium p-2 bg-muted/10 rounded border border-border">{viewingTransfer.destinationStoreName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="details-table-wrapper mb-6 border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-2 text-left">Producto</th>
                                            <th className="p-2 text-right">Cant.</th>
                                            <th className="p-2 text-right">Valor U.</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingTransfer.items.map((item, idx) => (
                                            <tr key={idx} className="border-t border-border">
                                                <td className="p-2">{item.productName}</td>
                                                <td className="p-2 text-right">{item.quantity}</td>
                                                <td className="p-2 text-right">${item.unitCost.toFixed(2)}</td>
                                                <td className="p-2 text-right font-medium">${item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/20 font-medium">
                                        <tr className="border-t border-border">
                                            <td colSpan={3} className="p-2 text-right">Valor Total Transferido</td>
                                            <td className="p-2 text-right text-lg">${viewingTransfer.totalValue.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {viewingTransfer.notes && (
                                <div className="mb-6">
                                    <p className="text-sm text-muted">Notas</p>
                                    <p className="text-sm italic p-2 bg-muted/20 rounded">{viewingTransfer.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions (Not Printed) */}
                        <div className="modal-actions flex justify-end items-center pt-4 border-t border-border no-print" style={{ gap: '1rem' }}>
                            {viewingTransfer.status === 'completed' && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/transfers/edit/${viewingTransfer.id}`)}
                                        icon={<Edit size={16} />}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-danger border-danger hover:bg-danger/10"
                                        onClick={handleRevertClick}
                                        icon={<RotateCcw size={16} />}
                                    >
                                        Revertir
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" onClick={handlePrint} icon={<Printer size={16} />}>
                                Imprimir
                            </Button>
                            <Button onClick={() => setViewingTransfer(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={isRevertConfirmOpen}
                title="Revertir Transferencia"
                message="¿Estás seguro? Esta acción cancelará la transferencia. Los productos serán devueltos a la tienda de origen y descontados de la tienda destino. Esta acción no se puede deshacer."
                confirmText="Sí, Revertir Movimiento"
                onConfirm={confirmRevert}
                onCancel={() => setIsRevertConfirmOpen(false)}
            />
        </div>
    );
};
