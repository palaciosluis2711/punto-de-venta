import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSales } from './hooks/useSales';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { Eye, Printer, CreditCard, Ticket, Filter, Copy } from 'lucide-react';
import type { Sale } from './types';
import { PostSaleView } from '../pos/components/PostSaleView';
import { useToast } from '../../shared/components/Toast/useToast';
import './SalesPage.css';
import { CustomSelect } from '../../shared/components/CustomSelect';

export const SalesPage: React.FC = () => {
    const { sales } = useSales();
    const { products } = useInventory();
    const { showToast } = useToast();
    const [viewingSale, setViewingSale] = useState<Sale | null>(null);
    const [ticketViewSale, setTicketViewSale] = useState<Sale | null>(null);
    const [showFilters, setShowFilters] = useState(() => {
        const stored = localStorage.getItem('sales_show_filters');
        return stored !== null ? JSON.parse(stored) : true;
    });

    useEffect(() => {
        localStorage.setItem('sales_show_filters', JSON.stringify(showFilters));
    }, [showFilters]);

    // Filters State
    const [filterId, setFilterId] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStore, setFilterStore] = useState('');
    const [filterPayment, setFilterPayment] = useState('');

    // Derived options for selects
    const uniqueStores = useMemo(() => Array.from(new Set(sales.map(s => s.storeName))), [sales]);
    const uniquePayments = useMemo(() => Array.from(new Set(sales.map(s => s.paymentMethod))), [sales]);
    const uniqueClients = useMemo(() => Array.from(new Set(sales.map(s => s.clientName))).sort(), [sales]);

    // Filtered Sales
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchId = sale.id.toLowerCase().includes(filterId.toLowerCase());
            const matchClient = filterClient ? sale.clientName === filterClient : true;
            
            let matchDate = true;
            if (filterDate) {
                const saleDate = new Date(sale.date).toISOString().split('T')[0];
                matchDate = saleDate === filterDate;
            }

            const matchStore = filterStore ? sale.storeName === filterStore : true;
            const matchPayment = filterPayment ? sale.paymentMethod === filterPayment : true;

            return matchId && matchClient && matchDate && matchStore && matchPayment;
        });
    }, [sales, filterId, filterClient, filterDate, filterStore, filterPayment]);

    const clearFilters = () => {
        setFilterId('');
        setFilterClient('');
        setFilterDate('');
        setFilterStore('');
        setFilterPayment('');
    };

    // Ref for printing content
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current) return;
        window.print();
    };

    return (
        <div className="sales-page animate-in">
            <div className="sales-header">
                <div>
                    <h1 className="sales-title">
                        <CreditCard className="text-primary" />
                        Ventas Realizadas
                    </h1>
                    <p className="sales-subtitle">Historial de todas las ventas procesadas en el POS.</p>
                </div>
                <div>
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)} 
                        icon={<Filter size={16} />}
                    >
                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="sales-filters-container">
                <div className="sales-filters-grid">
                    <div className="filter-group">
                        <label>ID del Recibo</label>
                        <Input 
                            placeholder="Buscar por ID..." 
                            value={filterId} 
                            onChange={(e: any) => setFilterId(e.target.value)} 
                        />
                    </div>
                    <div className="filter-group">
                        <label>Cliente</label>
                        <CustomSelect 
                            className="filter-select"
                            value={filterClient}
                            onChange={(e: any) => setFilterClient(e.target.value)}
                        >
                            <option value="">Todos los clientes</option>
                            {uniqueClients.map(client => (
                                <option key={client} value={client}>{client}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="filter-group">
                        <label>Fecha</label>
                        <Input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e: any) => setFilterDate(e.target.value)} 
                        />
                    </div>
                    <div className="filter-group">
                        <label>Tienda</label>
                        <CustomSelect 
                            className="filter-select"
                            value={filterStore}
                            onChange={(e: any) => setFilterStore(e.target.value)}
                        >
                            <option value="">Todas las tiendas</option>
                            {uniqueStores.map(store => (
                                <option key={store} value={store}>{store}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="filter-group">
                        <label>Método de Pago</label>
                        <CustomSelect 
                            className="filter-select"
                            value={filterPayment}
                            onChange={(e: any) => setFilterPayment(e.target.value)}
                        >
                            <option value="">Todos los métodos</option>
                            {uniquePayments.map(payment => (
                                <option key={payment} value={payment}>{payment}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="filter-group filter-actions">
                        <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                    </div>
                </div>
            </div>
            )}

            <div className="sales-table-container">
                <div className="sales-table-wrapper">
                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Tienda</th>
                                <th>Método de Pago</th>
                                <th className="table-cell-right">Total</th>
                                <th className="table-cell-right">Ganancia</th>
                                <th className="table-cell-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay ventas registradas.
                                    </td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No se encontraron ventas que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => {
                                    // Calculate total cost
                                    const totalCost = sale.items.reduce((acc, item) => {
                                        const cost = item.unitCost ?? (products.find(p => p.id === item.productId)?.cost || 0);
                                        return acc + (cost * item.quantity);
                                    }, 0);
                                    const estimatedProfit = sale.total - totalCost;

                                    return (
                                        <tr
                                            key={sale.id}
                                            onClick={() => setViewingSale(sale)}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        >
                                            <td>{new Date(sale.date).toLocaleString()}</td>
                                            <td style={{ fontWeight: 500 }}>{sale.clientName}</td>
                                            <td>
                                                <span className="badge-store">
                                                    {sale.storeName}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge-payment">
                                                    {sale.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="table-cell-right" style={{ fontWeight: 500 }}>
                                                ${sale.total.toFixed(2)}
                                            </td>
                                            <td className="table-cell-right" style={{ fontWeight: 500, color: estimatedProfit >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
                                                ${estimatedProfit.toFixed(2)}
                                            </td>
                                            <td className="table-cell-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Eye size={16} />}
                                                        title="Ver Detalles"
                                                        onClick={() => setViewingSale(sale)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={!!viewingSale}
                onClose={() => setViewingSale(null)}
                title="Detalle de Venta"
                maxWidth="800px"
            >
                {viewingSale && (
                    <div className="sale-details-content">
                        {/* Printable Area */}
                        <div ref={printRef} className="printable-area">
                            <div className="details-header mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Recibo de Venta</h3>
                                        <p className="text-muted text-sm flex items-center gap-2">
                                            ID: {viewingSale.id.slice(0, 8)}
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                style={{ padding: '0.25rem', height: 'auto', color: 'var(--text-secondary)' }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(viewingSale.id);
                                                    showToast('Copiado al Portapapeles con éxito', 'success');
                                                }}
                                                title="Copiar ID"
                                            >
                                                <Copy size={14} />
                                            </Button>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{new Date(viewingSale.date).toLocaleString()}</p>
                                        <span className="badge-status completed">Completado</span>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted">Cliente</p>
                                        <p className="font-medium">{viewingSale.clientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted">Tienda</p>
                                        <p className="font-medium">{viewingSale.storeName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="details-table-wrapper mb-6 border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-2 text-left">Producto</th>
                                            <th className="p-2 text-right">Cant.</th>
                                            <th className="p-2 text-right">Precio U.</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingSale.items.map((item, idx) => (
                                            <tr key={idx} className="border-t border-border">
                                                <td className="p-2">
                                                    {item.productName}
                                                    {item.isSpecialPrice && <span className="text-xs text-primary ml-1">(Promo)</span>}
                                                </td>
                                                <td className="p-2 text-right">{item.quantity}</td>
                                                <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                                                <td className="p-2 text-right font-medium">${item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/20">
                                        {/* Financial Breakdown */}
                                        <tr className="border-t border-border">
                                            <td colSpan={3} className="p-2 text-right">Subtotal</td>
                                            <td className="p-2 text-right">${(viewingSale.total + (viewingSale.discount || 0) - (viewingSale.shipping || 0)).toFixed(2)}</td>
                                        </tr>
                                        {viewingSale.discount && viewingSale.discount > 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-2 text-right text-success">Descuento</td>
                                                <td className="p-2 text-right text-success">-${viewingSale.discount.toFixed(2)}</td>
                                            </tr>
                                        ) : null}
                                        {viewingSale.shipping && viewingSale.shipping > 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-2 text-right text-warning">Envío</td>
                                                <td className="p-2 text-right text-warning">+${viewingSale.shipping.toFixed(2)}</td>
                                            </tr>
                                        ) : null}
                                        <tr className="font-bold border-t border-border">
                                            <td colSpan={3} className="p-2 text-right">Total</td>
                                            <td className="p-2 text-right text-lg">${viewingSale.total.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Payment Info */}
                            <div className="mb-6 p-4 bg-muted/20 rounded-md">
                                <h4 className="font-semibold text-sm mb-2">Información de Pago</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted">Método de Pago: </span>
                                        <span className="font-medium">{viewingSale.paymentMethod}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted">Cantidad Recibida: </span>
                                        <span className="font-medium">${viewingSale.receivedAmount.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted">Cambio: </span>
                                        <span className="font-medium">${viewingSale.change.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {viewingSale.notes && (Object.values(viewingSale.notes).some(n => n)) && (
                                <div className="mb-6 mt-8 p-4 bg-muted/20 rounded-md" style={{ paddingTop: '13px' }}>
                                    <h4 className="font-semibold text-sm mb-2">Notas Registradas</h4>
                                    <div className="space-y-2 text-sm">
                                        {viewingSale.notes.sale && (
                                            <div>
                                                <span className="text-muted">Nota de Venta: </span>
                                                <span className="font-medium">{viewingSale.notes.sale}</span>
                                            </div>
                                        )}
                                        {viewingSale.notes.payment && (
                                            <div>
                                                <span className="text-muted">Nota de Pago: </span>
                                                <span className="font-medium">{viewingSale.notes.payment}</span>
                                            </div>
                                        )}
                                        {viewingSale.notes.staff && (
                                            <div>
                                                <span className="text-muted">Nota Interna (Staff): </span>
                                                <span className="font-medium text-yellow-700 bg-yellow-50 px-1 rounded">{viewingSale.notes.staff}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions (Not Printed) */}
                        <div className="modal-actions flex justify-end items-center pt-4 border-t border-border no-print" style={{ gap: '1rem' }}>
                            <Button variant="outline" onClick={() => setTicketViewSale(viewingSale)} icon={<Ticket size={16} />}>
                                Ticket
                            </Button>
                            <Button variant="outline" onClick={handlePrint} icon={<Printer size={16} />}>
                                Imprimir
                            </Button>
                            <Button onClick={() => setViewingSale(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reprint Ticket Modal */}
            <PostSaleView 
                isOpen={!!ticketViewSale} 
                onClose={() => setTicketViewSale(null)} 
                sale={ticketViewSale} 
                isHistoryView={true} 
            />
        </div>
    );
};
