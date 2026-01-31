import React, { useState, useRef } from 'react';
import { useSales } from './hooks/useSales';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { Eye, Printer, CreditCard } from 'lucide-react';
import type { Sale } from './types';
import './SalesPage.css';

export const SalesPage: React.FC = () => {
    const { sales } = useSales();
    const [viewingSale, setViewingSale] = useState<Sale | null>(null);

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
            </div>

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
                                <th className="table-cell-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay ventas registradas.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
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
                                ))
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
                                        <p className="text-muted text-sm">ID: {viewingSale.id.slice(0, 8)}</p>
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
        </div>
    );
};
