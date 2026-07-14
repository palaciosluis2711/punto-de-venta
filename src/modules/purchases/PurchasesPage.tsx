import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchases } from './hooks/usePurchases';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { Input } from '../../shared/components/Input';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { Plus, ShoppingBag, Eye, Printer, RotateCcw, Edit, Filter, Copy } from 'lucide-react';
import type { Purchase } from './types';
import { useToast } from '../../shared/components/Toast/useToast';
import './PurchasesPage.css';

export const PurchasesPage: React.FC = () => {
    const { purchases, updatePurchase } = usePurchases();
    const { addStockToStore } = useInventory();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
    const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(() => {
        const stored = localStorage.getItem('purchases_show_filters');
        return stored !== null ? JSON.parse(stored) : true;
    });
    const [filterId, setFilterId] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStore, setFilterStore] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');

    useEffect(() => {
        localStorage.setItem('purchases_show_filters', JSON.stringify(showFilters));
    }, [showFilters]);

    // Derived options for selects
    const uniqueStores = useMemo(() => Array.from(new Set(purchases.map(p => p.storeName))), [purchases]);
    const uniqueSuppliers = useMemo(() => Array.from(new Set(purchases.map(p => p.supplierName))).sort(), [purchases]);

    // Filtered Purchases
    const filteredPurchases = useMemo(() => {
        return purchases.filter(purchase => {
            const matchId = purchase.id.toLowerCase().includes(filterId.toLowerCase());
            
            let matchDate = true;
            if (filterDate) {
                const purchaseDate = new Date(purchase.date).toISOString().split('T')[0];
                matchDate = purchaseDate === filterDate;
            }

            const matchStatus = filterStatus ? purchase.status === filterStatus : true;
            const matchStore = filterStore ? purchase.storeName === filterStore : true;
            const matchSupplier = filterSupplier ? purchase.supplierName === filterSupplier : true;

            return matchId && matchDate && matchStatus && matchStore && matchSupplier;
        });
    }, [purchases, filterId, filterDate, filterStatus, filterStore, filterSupplier]);

    const clearFilters = () => {
        setFilterId('');
        setFilterDate('');
        setFilterStatus('');
        setFilterStore('');
        setFilterSupplier('');
    };

    // Persistence Effect
    React.useEffect(() => {
        const isOpen = localStorage.getItem('app_purchases_details_open') === 'true';
        const viewId = localStorage.getItem('app_purchases_view_id');

        if (isOpen && viewId && purchases.length > 0 && !viewingPurchase) {
            const found = purchases.find(p => p.id === viewId);
            if (found) {
                setViewingPurchase(found);
            }
        }
    }, [purchases, viewingPurchase]);

    // Ref for printing content
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current) return;

        // Simple print approach: open a new window or use CSS print media
        // Here we'll rely on CSS @media print
        window.print();
    };

    const handleRevertClick = () => {
        setIsRevertConfirmOpen(true);
    };

    const confirmRevert = () => {
        if (!viewingPurchase) return;

        // Revert Stock
        viewingPurchase.items.forEach(item => {
            addStockToStore(item.productId, viewingPurchase.storeId, -item.quantity);
        });

        // Update Status
        updatePurchase(viewingPurchase.id, { status: 'cancelled' });

        // Update local state to reflect change immediately in modal
        setViewingPurchase({ ...viewingPurchase, status: 'cancelled' });
        setIsRevertConfirmOpen(false);
    };

    return (
        <div className="purchases-page animate-in">
            <div className="purchases-header">
                <div>
                    <h1 className="purchases-title">
                        <ShoppingBag className="text-primary" />
                        Compras
                    </h1>
                    <p className="purchases-subtitle">Gestiona el abastecimiento de tus tiendas.</p>
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
                    <Button onClick={() => navigate('/purchases/new')} icon={<Plus size={20} />}>
                        Nueva Compra
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="purchases-filters-container">
                    <div className="purchases-filters-grid">
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
                            <label>Tienda Destino</label>
                            <select 
                                className="filter-select"
                                value={filterStore}
                                onChange={e => setFilterStore(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {uniqueStores.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Proveedor</label>
                            <select 
                                className="filter-select"
                                value={filterSupplier}
                                onChange={e => setFilterSupplier(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-group filter-actions">
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="purchases-table-container">
                <div className="purchases-table-wrapper">
                    <table className="purchases-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Proveedor</th>
                                <th>Tienda Destino</th>
                                <th className="table-cell-right">Total</th>
                                <th className="table-cell-center">Estado</th>
                                <th className="table-cell-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay compras registradas.
                                    </td>
                                </tr>
                            ) : filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No se encontraron compras que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map((purchase) => (
                                    <tr
                                        key={purchase.id}
                                        onClick={() => {
                                            setViewingPurchase(purchase);
                                            localStorage.setItem('app_purchases_details_open', 'true');
                                            localStorage.setItem('app_purchases_view_id', purchase.id);
                                        }}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <td>{new Date(purchase.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 500 }}>{purchase.supplierName}</td>
                                        <td>
                                            <span className="badge-store">
                                                {purchase.storeName}
                                            </span>
                                        </td>
                                        <td className="table-cell-right" style={{ fontWeight: 500 }}>
                                            ${purchase.total.toFixed(2)}
                                        </td>
                                        <td className="table-cell-center">
                                            <span className={`badge-status ${purchase.status}`}>
                                                {purchase.status === 'completed' ? 'Completado' : 'Cancelado'}
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
                                                        setViewingPurchase(purchase);
                                                        localStorage.setItem('app_purchases_details_open', 'true');
                                                        localStorage.setItem('app_purchases_view_id', purchase.id);
                                                    }}
                                                />
                                                {purchase.status === 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Edit size={16} />}
                                                        title="Editar Compra"
                                                        onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
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
                isOpen={!!viewingPurchase}
                onClose={() => {
                    setViewingPurchase(null);
                    localStorage.setItem('app_purchases_details_open', 'false');
                    localStorage.removeItem('app_purchases_view_id');
                }}
                title="Detalle de Compra"
            >
                {viewingPurchase && (
                    <div className="purchase-details-content">
                        {/* Printable Area */}
                        <div ref={printRef} className="printable-area">
                            <div className="details-header mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Orden de Compra</h3>
                                        <p className="text-muted text-sm flex items-center gap-2">
                                            ID: {viewingPurchase.id.slice(0, 8)}
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                style={{ padding: '0.25rem', height: 'auto', color: 'var(--text-secondary)' }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(viewingPurchase.id);
                                                    showToast('Copiado al Portapapeles con éxito', 'success');
                                                }}
                                                title="Copiar ID"
                                            >
                                                <Copy size={14} />
                                            </Button>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                                        <span className={`badge-status ${viewingPurchase.status}`}>
                                            {viewingPurchase.status === 'completed' ? 'Completado' : 'Cancelado'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted">Proveedor</p>
                                        <p className="font-medium">{viewingPurchase.supplierName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted">Tienda Destino</p>
                                        <p className="font-medium">{viewingPurchase.storeName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="details-table-wrapper mb-6 border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-2 text-left">Producto</th>
                                            <th className="p-2 text-right">Cant.</th>
                                            <th className="p-2 text-right">Costo U.</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingPurchase.items.map((item, idx) => (
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
                                            <td colSpan={3} className="p-2 text-right">Total</td>
                                            <td className="p-2 text-right text-lg">${viewingPurchase.total.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {viewingPurchase.notes && (
                                <div className="mb-6">
                                    <p className="text-sm text-muted">Notas</p>
                                    <p className="text-sm italic p-2 bg-muted/20 rounded">{viewingPurchase.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions (Not Printed) */}
                        <div className="modal-actions flex justify-end items-center pt-4 border-t border-border no-print" style={{ gap: '1rem' }}>
                            {viewingPurchase.status === 'completed' && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/purchases/edit/${viewingPurchase.id}`)}
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
                                        Revertir Compra
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" onClick={handlePrint} icon={<Printer size={16} />}>
                                Imprimir
                            </Button>
                            <Button onClick={() => {
                                setViewingPurchase(null);
                                localStorage.setItem('app_purchases_details_open', 'false');
                                localStorage.removeItem('app_purchases_view_id');
                            }}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={isRevertConfirmOpen}
                title="Revertir Compra"
                message="¿Estás seguro? Esta acción cancelará la compra y descontará los productos del inventario de la tienda seleccionada. Esta acción no se puede deshacer."
                confirmText="Sí, Revertir y Descontar"
                onConfirm={confirmRevert}
                onCancel={() => setIsRevertConfirmOpen(false)}
            />
        </div>
    );
};
