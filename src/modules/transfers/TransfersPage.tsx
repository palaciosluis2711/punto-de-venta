import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransfers } from './hooks/useTransfers';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { Input } from '../../shared/components/Input';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { Plus, ArrowRightLeft, Eye, Printer, RotateCcw, Edit, Filter, Copy } from 'lucide-react';
import type { Transfer } from './types';
import { useToast } from '../../shared/components/Toast/useToast';
import './TransfersPage.css';

export const TransfersPage: React.FC = () => {
    const { transfers, updateTransfer } = useTransfers();
    const { updateStockBulk } = useInventory();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [viewingTransfer, setViewingTransfer] = useState<Transfer | null>(null);
    const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(() => {
        const stored = localStorage.getItem('transfers_show_filters');
        return stored !== null ? JSON.parse(stored) : true;
    });
    const [filterId, setFilterId] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterDestination, setFilterDestination] = useState('');

    useEffect(() => {
        localStorage.setItem('transfers_show_filters', JSON.stringify(showFilters));
    }, [showFilters]);

    // Derived options for selects
    const uniqueSources = useMemo(() => Array.from(new Set(transfers.map(t => t.sourceStoreName))), [transfers]);
    const uniqueDestinations = useMemo(() => Array.from(new Set(transfers.map(t => t.destinationStoreName))), [transfers]);

    // Filtered Transfers
    const filteredTransfers = useMemo(() => {
        return transfers.filter(transfer => {
            const matchId = transfer.id.toLowerCase().includes(filterId.toLowerCase());
            
            let matchDate = true;
            if (filterDate) {
                const transferDate = new Date(transfer.date).toISOString().split('T')[0];
                matchDate = transferDate === filterDate;
            }

            const matchStatus = filterStatus ? transfer.status === filterStatus : true;
            const matchSource = filterSource ? transfer.sourceStoreName === filterSource : true;
            const matchDest = filterDestination ? transfer.destinationStoreName === filterDestination : true;

            return matchId && matchDate && matchStatus && matchSource && matchDest;
        });
    }, [transfers, filterId, filterDate, filterStatus, filterSource, filterDestination]);

    const clearFilters = () => {
        setFilterId('');
        setFilterDate('');
        setFilterStatus('');
        setFilterSource('');
        setFilterDestination('');
    };

    // Persistence Effect
    React.useEffect(() => {
        const isOpen = localStorage.getItem('app_transfers_details_open') === 'true';
        const viewId = localStorage.getItem('app_transfers_view_id');

        if (isOpen && viewId && transfers.length > 0 && !viewingTransfer) {
            const found = transfers.find(t => t.id === viewId);
            if (found) {
                setViewingTransfer(found);
            }
        }
    }, [transfers, viewingTransfer]);

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
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)} 
                        icon={<Filter size={16} />}
                        style={{ marginRight: '2rem' }}
                    >
                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                    <Button onClick={() => navigate('/transfers/new')} icon={<Plus size={20} />}>
                        Nueva Transferencia
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="transfers-filters-container">
                    <div className="transfers-filters-grid">
                        <div className="filter-group">
                            <label>ID</label>
                            <Input 
                                placeholder="Buscar ID..." 
                                value={filterId} 
                                onChange={e => setFilterId(e.target.value)} 
                            />
                        </div>
                        <div className="filter-group">
                            <label>Fecha</label>
                            <Input 
                                type="date" 
                                value={filterDate} 
                                onChange={e => setFilterDate(e.target.value)} 
                            />
                        </div>
                        <div className="filter-group">
                            <label>Estado</label>
                            <select 
                                className="filter-select"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Origen</label>
                            <select 
                                className="filter-select"
                                value={filterSource}
                                onChange={e => setFilterSource(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Destino</label>
                            <select 
                                className="filter-select"
                                value={filterDestination}
                                onChange={e => setFilterDestination(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {uniqueDestinations.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="filter-group filter-actions">
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </div>
                </div>
            )}

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
                            ) : filteredTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No se encontraron transferencias que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransfers.map((transfer) => (
                                    <tr
                                        key={transfer.id}
                                        onClick={() => {
                                            setViewingTransfer(transfer);
                                            localStorage.setItem('app_transfers_details_open', 'true');
                                            localStorage.setItem('app_transfers_view_id', transfer.id);
                                        }}
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
                                            <span className={`badge-status ${transfer.status} ${transfer.notes?.includes('automática') ? 'automated' : ''}`}>
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
                                                    onClick={() => {
                                                        setViewingTransfer(transfer);
                                                        localStorage.setItem('app_transfers_details_open', 'true');
                                                        localStorage.setItem('app_transfers_view_id', transfer.id);
                                                    }}
                                                />
                                                {transfer.status === 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Edit size={16} />}
                                                        title={transfer.notes?.includes('automática') ? "Transferencia automática (No editable)" : "Editar Transferencia"}
                                                        onClick={() => navigate(`/transfers/edit/${transfer.id}`)}
                                                        disabled={transfer.notes?.includes('automática')}
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
                onClose={() => {
                    setViewingTransfer(null);
                    localStorage.setItem('app_transfers_details_open', 'false');
                    localStorage.removeItem('app_transfers_view_id');
                }}
                title="Detalle de Transferencia"
            >
                {viewingTransfer && (
                    <div className="transfer-details-content">
                        {/* Printable Area */}
                        <div ref={printRef} className="printable-area">
                            <div className="details-header mb-6">
                                <div className="flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>Orden de Transferencia</h3>
                                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ID: {viewingTransfer.id.slice(0, 8)}
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                style={{ padding: '0.25rem', height: 'auto', color: 'var(--text-secondary)' }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(viewingTransfer.id);
                                                    showToast('Copiado al Portapapeles con éxito', 'success');
                                                }}
                                                title="Copiar ID"
                                            >
                                                <Copy size={14} />
                                            </Button>
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>{new Date(viewingTransfer.date).toLocaleDateString()}</p>
                                        <span style={{ 
                                            padding: '0.25rem 0.5rem', 
                                            borderRadius: '999px', 
                                            fontSize: '0.75rem',
                                            backgroundColor: viewingTransfer.status === 'completed' 
                                                ? (viewingTransfer.notes?.includes('automática') ? '#8b5cf6' : 'var(--success)') 
                                                : 'var(--danger)',
                                            color: '#fff'
                                        }}>
                                            {viewingTransfer.status === 'completed' ? 'Completado' : 'Cancelado'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>Origen</p>
                                        <p style={{ fontWeight: '500', padding: '0.5rem', backgroundColor: 'var(--muted)', borderRadius: '4px', margin: 0 }}>
                                            {viewingTransfer.sourceStoreName}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>Destino</p>
                                        <p style={{ fontWeight: '500', padding: '0.5rem', backgroundColor: 'var(--muted)', borderRadius: '4px', margin: 0 }}>
                                            {viewingTransfer.destinationStoreName}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: 'var(--muted)' }}>
                                        <tr>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Producto</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Cant.</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Valor U.</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingTransfer.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.5rem' }}>{item.productName}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>${item.unitCost.toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '500' }}>${item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ backgroundColor: 'var(--muted)', fontWeight: '500' }}>
                                        <tr>
                                            <td colSpan={3} style={{ padding: '0.5rem', textAlign: 'right' }}>Valor Total Transferido</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '1.125rem' }}>${viewingTransfer.totalValue.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {viewingTransfer.notes && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Notas</p>
                                    <p style={{ fontSize: '0.875rem', fontStyle: 'italic', padding: '0.5rem', backgroundColor: 'var(--muted)', borderRadius: '4px', margin: 0 }}>
                                        {viewingTransfer.notes}
                                    </p>
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
                                        disabled={viewingTransfer.notes?.includes('automática')}
                                        title={viewingTransfer.notes?.includes('automática') ? "Transferencia automática (No editable)" : ""}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-danger border-danger hover:bg-danger/10"
                                        onClick={handleRevertClick}
                                        icon={<RotateCcw size={16} />}
                                        disabled={viewingTransfer.notes?.includes('automática')}
                                        title={viewingTransfer.notes?.includes('automática') ? "Transferencia automática (No editable)" : ""}
                                    >
                                        Revertir
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" onClick={handlePrint} icon={<Printer size={16} />}>
                                Imprimir
                            </Button>
                            <Button onClick={() => {
                                setViewingTransfer(null);
                                localStorage.setItem('app_transfers_details_open', 'false');
                                localStorage.removeItem('app_transfers_view_id');
                            }}>
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
