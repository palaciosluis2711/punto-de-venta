import React, { useState, useEffect } from 'react';
import { Store, Package, Plus, Search, X, Trash2, Copy } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useToast } from '../../../shared/components/Toast/useToast';
import type { Product } from '../types';
import type { Store as StoreType } from '../../settings/hooks/useStores';
import { CustomSelect } from '../../../shared/components/CustomSelect';

export interface RequestItem {
    productId: string;
    productName: string;
    requestedQuantity: number | string;
    currentStock?: number;
}

interface ProductRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    activeStoreId: string;
    stores: StoreType[];
    onSubmit: (targetStoreId: string, items: RequestItem[], notes: string) => void;
}

export const ProductRequestModal: React.FC<ProductRequestModalProps> = ({
    isOpen,
    onClose,
    products,
    activeStoreId,
    stores,
    onSubmit
}) => {
    const [targetStoreId, setTargetStoreId] = useState<string>('');
    const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [notes, setNotes] = useState('');
    const { showToast } = useToast();

    const availableStores = stores.filter(s => s.id !== activeStoreId);

    // Auto-populate when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialItems: RequestItem[] = [];
            products.forEach(product => {
                const stock = product.inventory?.[activeStoreId] || 0;
                const minStock = product.minStock || 5; // Default alert threshold if not set
                
                // Exclude bundles from direct stock requests for now
                if (product.associatedProducts && product.associatedProducts.length > 0) return;

                if (stock <= minStock) {
                    initialItems.push({
                        productId: product.id,
                        productName: product.name,
                        currentStock: stock,
                        requestedQuantity: Math.max(1, minStock - stock + 5) // Suggest a quantity to bring it safely above min
                    });
                }
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRequestItems(initialItems);
            setTargetStoreId('');
            setSearchQuery('');
            setNotes('');
        }
    }, [isOpen, products, activeStoreId]);

    const handleQuantityChange = (productId: string, qtyStr: string) => {
        if (qtyStr === '') {
            setRequestItems(prev => prev.map(item => 
                item.productId === productId ? { ...item, requestedQuantity: '' } : item
            ));
            return;
        }
        
        const qty = parseInt(qtyStr) || 0;
        setRequestItems(prev => prev.map(item => 
            item.productId === productId ? { ...item, requestedQuantity: Math.max(1, qty) } : item
        ));
    };

    const handleBlur = (productId: string, currentRequested: number | string) => {
        if (currentRequested === '') {
            setRequestItems(prev => prev.map(item => 
                item.productId === productId ? { ...item, requestedQuantity: 1 } : item
            ));
        }
    };

    const handleRemoveItem = (productId: string) => {
        setRequestItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleCopyList = () => {
        if (requestItems.length === 0) return;
        
        const listText = requestItems.map(item => {
            const qty = typeof item.requestedQuantity === 'string' ? parseInt(item.requestedQuantity) || 0 : item.requestedQuantity;
            return `- ${item.productName} (${qty})`;
        }).join('\n');
        
        navigator.clipboard.writeText(`Productos Solicitados:\n${listText}`);
        showToast('Lista copiada al portapapeles', 'success');
    };

    const handleManualAdd = (product: Product) => {
        if (requestItems.some(i => i.productId === product.id)) return; // already added

        const stock = product.inventory?.[activeStoreId] || 0;
        setRequestItems(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            currentStock: stock,
            requestedQuantity: 10
        }]);
        setSearchQuery(''); // clear search
    };

    const searchResults = searchQuery ? products.filter(p => 
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.barcode.includes(searchQuery)) && 
        !(p.associatedProducts && p.associatedProducts.length > 0) &&
        !requestItems.some(i => i.productId === p.id)
    ).slice(0, 5) : [];

    const hasAnyStockInTarget = requestItems.some(item => {
        const product = products.find(p => p.id === item.productId);
        const targetStock = targetStoreId && product?.inventory ? (product.inventory[targetStoreId] || 0) : 0;
        return targetStock > 0;
    });

    const handleSubmit = () => {
        if (!targetStoreId || requestItems.length === 0 || !hasAnyStockInTarget) return;
        // Filter out items with 0 or empty quantity
        const validItems = requestItems
            .map(i => ({ ...i, requestedQuantity: typeof i.requestedQuantity === 'string' ? 0 : i.requestedQuantity }))
            .filter(i => i.requestedQuantity > 0);
        
        if (validItems.length > 0) {
            onSubmit(targetStoreId, validItems as RequestItem[], notes);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Solicitar Productos a otra Sucursal"
            disableOutsideClick={true}
            maxWidth="900px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '65vh' }}>
                
                <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                    {/* Columna Izquierda: Controles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: '0 0 350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        
                        <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Store size={16} /> Pedir a:
                                </label>
                                <CustomSelect
                                    className="input-field"
                                    value={targetStoreId}
                                    onChange={(val: any) => setTargetStoreId(val.target ? val.target.value : val)}
                                    style={{ borderColor: !targetStoreId ? 'var(--error)' : 'var(--border)' }}
                                >
                                    <option value="" disabled>Seleccione una sucursal...</option>
                                    {availableStores.map(store => (
                                        <option key={store.id} value={store.id}>{store.name}</option>
                                    ))}
                                </CustomSelect>
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Añadir productos adicionales</label>
                            <Input
                                placeholder="Buscar producto extra para añadir..."
                                icon={<Search size={16} />}
                                value={searchQuery}
                                onChange={(val: any) => setSearchQuery(val.target ? val.target.value : val)}
                                rightElement={
                                    searchQuery ? (
                                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} style={{ padding: 4 }}>
                                            <X size={14} />
                                        </Button>
                                    ) : undefined
                                }
                            />
                            {searchResults.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%', left: 0, right: 0,
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    zIndex: 10,
                                    boxShadow: 'var(--shadow-md)',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    marginTop: '4px'
                                }}>
                                    {searchResults.map(p => (
                                        <div 
                                            key={p.id}
                                            style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            onClick={() => handleManualAdd(p)}
                                            className="hover:bg-surface-hover"
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Stock local: {p.inventory?.[activeStoreId] || 0}</div>
                                            </div>
                                            <Button size="sm" variant="outline" style={{ pointerEvents: 'none' }}>
                                                <Plus size={14} /> Añadir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="input-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label className="input-label">Notas / Razón de la Solicitud (Opcional)</label>
                            <textarea
                                className="input-field"
                                value={notes}
                                onChange={(val: any) => setNotes(val.target ? val.target.value : val)}
                                placeholder="Ej. Reabastecimiento urgente para temporada..."
                                style={{ resize: 'none', flex: 1 }}
                            />
                        </div>
                    </div>

                    {/* Columna Derecha: Tabla */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={18} className="text-primary" />
                                Productos Solicitados ({requestItems.length})
                                {requestItems.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={handleCopyList} title="Copiar lista" style={{ padding: 4, height: 'auto', minHeight: 'auto' }}>
                                        <Copy size={16} />
                                    </Button>
                                )}
                            </h4>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            {requestItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                    No hay productos en la solicitud.
                                </div>
                            ) : (
                                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                    <thead style={{ color: 'var(--text-muted)' }}>
                                        <tr>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Producto</th>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Tu Stock</th>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'right', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>A Pedir</th>
                                            <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--border)' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestItems.map(item => {
                                            const product = products.find(p => p.id === item.productId);
                                            const targetStock = targetStoreId && product?.inventory ? (product.inventory[targetStoreId] || 0) : null;
                                            const currentRequested = typeof item.requestedQuantity === 'string' ? 0 : item.requestedQuantity;
                                            const isTargetStockLow = targetStock !== null && (targetStock <= 0 || targetStock < currentRequested);
                                            
                                            return (
                                                <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={item.productName}>
                                                            {item.productName}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                                        <span style={{ color: (item.currentStock ?? 0) <= 0 ? 'var(--error)' : 'inherit', fontWeight: (item.currentStock ?? 0) <= 0 ? 'bold' : 'normal' }}>
                                                            {item.currentStock ?? 0}
                                                        </span>
                                                        {targetStock !== null && (
                                                            <span style={{ 
                                                                color: isTargetStockLow ? 'var(--error)' : 'var(--muted-foreground)', 
                                                                fontWeight: isTargetStockLow ? 'bold' : 'normal',
                                                                fontSize: '0.85em', 
                                                                marginLeft: '0.25rem' 
                                                            }}>
                                                                ({targetStock})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            style={{ width: '70px', padding: '0.25rem 0.5rem', textAlign: 'center', height: 'auto' }}
                                                            value={item.requestedQuantity}
                                                            onChange={(e: any) => handleQuantityChange(item.productId, e.target.value)}
                                                            onBlur={() => handleBlur(item.productId, item.requestedQuantity)}
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.productId)} style={{ padding: 4 }} className="text-danger hover:bg-danger/10">
                                                            <Trash2 size={16} />
                                                        </Button>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    {targetStoreId && requestItems.length > 0 && !hasAnyStockInTarget && (
                        <div style={{ color: 'var(--error)', fontSize: '0.875rem', textAlign: 'right', fontWeight: 500 }}>
                            La sucursal seleccionada no cuenta con stock de ninguno de los productos solicitados.
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={!targetStoreId || requestItems.length === 0 || !hasAnyStockInTarget}
                        >
                            Enviar Solicitud
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
