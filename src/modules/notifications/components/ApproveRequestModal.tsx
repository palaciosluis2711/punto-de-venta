import React, { useState, useEffect } from 'react';
import { Store, Package, Check } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import type { Notification } from '../types';
import type { Product } from '../../inventory/types';
import type { Store as StoreType } from '../../settings/hooks/useStores';

export interface ApprovedItem {
    productId: string;
    productName: string;
    requestedQuantity: number;
    approvedQuantity: number | string;
    unitCost: number;
}

interface ApproveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
    products: Product[];
    stores: StoreType[];
    activeStoreId: string;
    onSubmit: (approvedItems: ApprovedItem[], notes: string) => void;
}

export const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({
    isOpen,
    onClose,
    notification,
    products,
    stores,
    activeStoreId,
    onSubmit
}) => {
    const [approvedItems, setApprovedItems] = useState<ApprovedItem[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && notification && notification.payload?.items) {
            const initialItems: ApprovedItem[] = notification.payload.items.map((item: { productId: string; productName: string; requestedQuantity: number }) => {
                const product = products.find(p => p.id === item.productId);
                const localStock = product?.inventory?.[activeStoreId] || 0;
                // Default approved quantity is the requested quantity, capped at local stock
                const defaultApproved = Math.min(item.requestedQuantity, localStock);
                
                return {
                    productId: item.productId,
                    productName: item.productName,
                    requestedQuantity: item.requestedQuantity,
                    approvedQuantity: Math.max(0, defaultApproved),
                    unitCost: product?.cost || 0
                };
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setApprovedItems(initialItems);
            setNotes('');
        }
    }, [isOpen, notification, products, activeStoreId]);

    const handleQuantityChange = (productId: string, qtyStr: string, localStock: number) => {
        if (qtyStr === '') {
            setApprovedItems(prev => prev.map(item => 
                item.productId === productId ? { ...item, approvedQuantity: '' } : item
            ));
            return;
        }

        let qty = parseInt(qtyStr) || 0;
        
        if (qty > localStock) {
            qty = localStock;
        }

        setApprovedItems(prev => prev.map(item => 
            item.productId === productId ? { ...item, approvedQuantity: Math.max(0, qty) } : item
        ));
    };

    const handleBlur = (productId: string, requestedQuantity: number, localStock: number, currentApproved: number | string) => {
        if (currentApproved === '') {
            const defaultQty = Math.min(requestedQuantity, localStock);
            setApprovedItems(prev => prev.map(item => 
                item.productId === productId ? { ...item, approvedQuantity: Math.max(0, defaultQty) } : item
            ));
        }
    };

    const handleSubmit = () => {
        // Filter out items that were completely rejected (qty = 0 or empty)
        const itemsToTransfer = approvedItems
            .map(i => ({ ...i, approvedQuantity: typeof i.approvedQuantity === 'string' ? 0 : i.approvedQuantity }))
            .filter(i => i.approvedQuantity > 0);
        onSubmit(itemsToTransfer as ApprovedItem[], notes);
    };

    if (!notification) return null;

    const sourceStoreName = stores.find(s => s.id === notification.sourceStoreId)?.name || 'Tienda Desconocida';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Aprobar Solicitud de Productos"
            disableOutsideClick={true}
            maxWidth="900px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '65vh' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                    {/* Columna Izquierda: Información y Notas */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: '0 0 350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Store size={18} className="text-primary" />
                                Solicitante: {sourceStoreName}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                Revisa los productos solicitados. Puedes ajustar la cantidad a enviar si no cuentas con el stock suficiente.
                                Al aprobar, se descontará de tu inventario y se generará una transferencia completada.
                            </p>
                        </div>

                        <div className="input-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label className="input-label">Notas para el solicitante (Opcional)</label>
                            <textarea
                                className="input-field"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej. Te envié menos piezas porque también me estoy quedando sin stock..."
                                style={{ resize: 'none', flex: 1 }}
                            />
                        </div>
                    </div>

                    {/* Columna Derecha: Tabla */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={18} className="text-primary" />
                                Productos Solicitados ({approvedItems.length})
                            </h4>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            {approvedItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                    No hay productos en la solicitud.
                                </div>
                            ) : (
                                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                    <thead style={{ color: 'var(--text-muted)' }}>
                                        <tr>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Producto</th>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Tu Stock</th>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Solicitado</th>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'right', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>A Enviar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approvedItems.map(item => {
                                            const product = products.find(p => p.id === item.productId);
                                            const localStock = product?.inventory?.[activeStoreId] || 0;
                                            const currentApproved = typeof item.approvedQuantity === 'string' ? 0 : item.approvedQuantity;
                                            const hasEnough = localStock >= currentApproved;
                                            const isStockLow = localStock <= 0 || localStock < item.requestedQuantity;
                                            
                                            return (
                                                <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={item.productName}>
                                                            {item.productName}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                                        <span style={{ color: isStockLow ? 'var(--error)' : 'inherit', fontWeight: isStockLow ? 'bold' : 'normal' }}>
                                                            {localStock}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                        {item.requestedQuantity}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            style={{ 
                                                                width: '70px', 
                                                                padding: '0.25rem 0.5rem', 
                                                                textAlign: 'center', 
                                                                height: 'auto',
                                                                borderColor: !hasEnough && localStock > 0 ? 'var(--error)' : 'var(--border)',
                                                                backgroundColor: !hasEnough && localStock > 0 ? 'rgba(239, 68, 68, 0.05)' : (localStock <= 0 ? 'var(--surface-hover)' : 'var(--surface)'),
                                                                cursor: localStock <= 0 ? 'not-allowed' : 'auto'
                                                            }}
                                                            value={item.approvedQuantity}
                                                            onChange={(e) => handleQuantityChange(item.productId, e.target.value, localStock)}
                                                            onBlur={() => handleBlur(item.productId, item.requestedQuantity, localStock, item.approvedQuantity)}
                                                            min="0"
                                                            max={localStock}
                                                            disabled={localStock <= 0}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={approvedItems.length === 0}
                        icon={<Check size={18} />}
                    >
                        Aprobar y Transferir
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
