import React, { useState, useEffect } from 'react';
import { Store, Package } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import type { Product } from '../../inventory/types';
import type { Store as StoreType } from '../../settings/hooks/useStores';

export interface MissingStockItem {
    product: Product;
    cartQuantity: number;
    localStock: number;
    missingQuantity: number;
}

export interface MissingItemResolution {
    productId: string;
    productName: string;
    requestedQuantity: number;
    transferredQuantity: number;
    sourceStoreId: string;
    unitPrice: number; // For transfer subtotal
}

interface PosStockWarningModalProps {
    isOpen: boolean;
    missingItems: MissingStockItem[];
    stores: StoreType[];
    activeStoreId: string;
    onCancel: () => void;
    onProceed: (resolutions: MissingItemResolution[]) => void;
}

export const PosStockWarningModal: React.FC<PosStockWarningModalProps> = ({
    isOpen,
    missingItems,
    stores,
    activeStoreId,
    onCancel,
    onProceed
}) => {
    // Map of productId -> selected sourceStoreId
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [noTransfer, setNoTransfer] = useState(false);

    // Reset noTransfer on open
    useEffect(() => {
        if (isOpen) {
            setNoTransfer(false);
        }
    }, [isOpen]);

    // Initialize selections on mount or when missingItems change
    useEffect(() => {
        if (isOpen && missingItems.length > 0) {
            const initialSelections: Record<string, string> = {};

            missingItems.forEach(item => {
                // Find all stores (except active) that have enough stock
                const availableStores = stores.filter(s =>
                    s.id !== activeStoreId &&
                    item.product.inventory &&
                    (item.product.inventory[s.id] || 0) >= item.missingQuantity
                );

                if (availableStores.length > 0) {
                    // Auto-select the first one
                    initialSelections[item.product.id] = availableStores[0].id;
                } else {
                    // If no store has enough, try to find ANY store with some stock, or just leave empty
                    const anyStoresWithStock = stores.filter(s =>
                        s.id !== activeStoreId &&
                        item.product.inventory &&
                        (item.product.inventory[s.id] || 0) > 0
                    ).sort((a, b) => (item.product.inventory![b.id] || 0) - (item.product.inventory![a.id] || 0)); // Descending stock

                    if (anyStoresWithStock.length > 0) {
                        initialSelections[item.product.id] = anyStoresWithStock[0].id;
                    } else {
                        initialSelections[item.product.id] = ''; // No available store
                    }
                }
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelections(initialSelections);
        }
    }, [isOpen, missingItems, stores, activeStoreId]);

    const handleSelectionChange = (productId: string, storeId: string) => {
        setSelections(prev => ({
            ...prev,
            [productId]: storeId
        }));
    };

    const handleProceed = () => {
        if (noTransfer) {
            onProceed([]);
            return;
        }

        const resolutions: MissingItemResolution[] = missingItems.map(item => {
            const sourceStoreId = selections[item.product.id] || '';
            let transferredQuantity = item.missingQuantity;
            
            if (sourceStoreId) {
                const sourceStock = item.product.inventory?.[sourceStoreId] || 0;
                transferredQuantity = Math.min(item.missingQuantity, sourceStock);
            }

            return {
                productId: item.product.id,
                productName: item.product.name,
                requestedQuantity: item.missingQuantity,
                transferredQuantity,
                sourceStoreId,
                unitPrice: item.product.cost || 0 // Transfers usually use cost or 0
            };
        }).filter(res => res.sourceStoreId !== ''); // Only proceed with items that have a source store selected

        onProceed(resolutions);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title="⚠️ Advertencia de Inventario"
        >
            <div style={{ padding: '0 0 1rem 0' }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.5, color: 'var(--muted-foreground)' }}>
                    Algunos productos agregados al carrito no están disponibles en esta tienda.
                    Por favor, selecciona desde qué sucursal deseas transferir los productos faltantes.
                </p>

                <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input 
                        type="checkbox" 
                        id="no-transfer" 
                        checked={noTransfer} 
                        onChange={(e) => setNoTransfer(e.target.checked)} 
                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    <label htmlFor="no-transfer" style={{ fontWeight: 500, cursor: 'pointer', margin: 0, color: 'var(--text-primary)' }}>
                        No transferir de otra tienda
                    </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '50vh', overflowY: 'auto' }}>
                    {missingItems.map((item, index) => {
                        const availableStores = stores.filter(s => s.id !== activeStoreId);

                        return (
                            <div key={`${item.product.id}-${index}`} style={{
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--surface)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={16} className="text-primary" />
                                        {item.product.name}
                                    </h4>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--danger)' }}>
                                        Faltan: {item.missingQuantity}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                    Stock local: {item.localStock} | Solicitado: {item.cartQuantity}
                                </div>

                                <div className="input-group">
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Store size={14} /> Transferir desde:
                                    </label>
                                    <select
                                        className="input-field"
                                        value={selections[item.product.id] || ''}
                                        onChange={(e) => handleSelectionChange(item.product.id, e.target.value)}
                                        style={{ borderColor: !selections[item.product.id] && !noTransfer ? 'var(--danger)' : 'var(--border)' }}
                                        disabled={noTransfer}
                                    >
                                        <option value="" disabled>Seleccione una sucursal...</option>
                                        {availableStores.map(store => {
                                            const storeStock = item.product.inventory ? (item.product.inventory[store.id] || 0) : 0;
                                            return (
                                                <option key={store.id} value={store.id}>
                                                    {store.name} (Disponible: {storeStock})
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {!selections[item.product.id] && !noTransfer && (
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--danger)' }}>
                                            Ninguna tienda tiene stock suficiente, la venta dejará el inventario en 0.
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <Button variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleProceed}>
                        Proceder
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
