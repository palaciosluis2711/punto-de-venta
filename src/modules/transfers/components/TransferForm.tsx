import React, { useState, useEffect, useCallback } from 'react';
import { useStores } from '../../settings/hooks/useStores';
import { useInventory } from '../../inventory/hooks/useInventory';
import type { TransferItem, Transfer } from '../types';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Search, Trash2, Save, ArrowRight } from 'lucide-react';
import type { Product } from '../../inventory/types';

interface TransferFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isProcessing?: boolean;
    initialData?: Transfer | null;
}

export const TransferForm: React.FC<TransferFormProps> = ({ onSubmit, onCancel, isProcessing, initialData }) => {
    const { stores, activeStoreId } = useStores();
    const { products } = useInventory();

    const [sourceStoreId, setSourceStoreId] = useState('');
    const [destinationStoreId, setDestinationStoreId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<TransferItem[]>([]);

    // Initialize form with data if provided
    useEffect(() => {
        if (initialData) {
            setSourceStoreId(initialData.sourceStoreId);
            setDestinationStoreId(initialData.destinationStoreId);
            const formattedDate = new Date(initialData.date).toISOString().split('T')[0];
            setDate(formattedDate);
            setItems(initialData.items);
        } else {
            // Restore from localStorage first
            const savedState = localStorage.getItem('app_transfer_form_state');
            let restored = false;
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    setSourceStoreId(parsed.sourceStoreId || '');
                    setDestinationStoreId(parsed.destinationStoreId || '');
                    if (parsed.items) setItems(parsed.items);
                    restored = true;
                } catch (e) {
                    console.error("Failed to restore transfer draft", e);
                }
            }

            // Default Source Store to Active Store if creating new AND nothing restored (or override if preferred? Let's check)
            // If restored definition exists, we assume user wants that. If not, default.
            if (!restored && activeStoreId) {
                setSourceStoreId(activeStoreId);
            }
        }
    }, [initialData, activeStoreId]);

    // Persist state
    useEffect(() => {
        if (!initialData) {
            const stateToSave = { sourceStoreId, destinationStoreId, items };
            localStorage.setItem('app_transfer_form_state', JSON.stringify(stateToSave));
        }
    }, [sourceStoreId, destinationStoreId, items, initialData]);

    // Item adding state
    const [searchTerm, setSearchTerm] = useState('');
    const searchResults = React.useMemo(() => {
        if (!searchTerm) return [];
        const lower = searchTerm.toLowerCase();
        return products.filter(p =>
            (p.name.toLowerCase().includes(lower) ||
                p.barcode.includes(lower)) &&
            (!p.associatedProducts || p.associatedProducts.length === 0)
        );
    }, [searchTerm, products]);

    const handleSelectProduct = useCallback((product: Product) => {
        setSearchTerm('');
        setItems(prev => {
            const existingIndex = prev.findIndex(item => item.productId === product.id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + 1,
                    subtotal: (updated[existingIndex].quantity + 1) * updated[existingIndex].unitCost
                };
                return updated;
            } else {
                return [...prev, {
                    productId: product.id,
                    productName: product.name,
                    quantity: 1,
                    unitCost: product.cost,
                    subtotal: 1 * product.cost
                }];
            }
        });
    }, []);

    // Auto-add effect for perfect match
    useEffect(() => {
        if (searchResults.length === 1 && searchTerm) {
            handleSelectProduct(searchResults[0]);
        }
    }, [searchResults, searchTerm, handleSelectProduct]);

    const handleUpdateItem = (index: number, quantity: number) => {
        if (quantity < 1) return;
        setItems(prev => {
            const updated = [...prev];
            const item = { ...updated[index] };
            item.quantity = quantity;
            item.subtotal = item.quantity * item.unitCost;
            updated[index] = item;
            return updated;
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const getProductStockInSource = (productId: string) => {
        if (!sourceStoreId) return 0;
        const product = products.find(p => p.id === productId);
        return product?.inventory?.[sourceStoreId] || 0;
    };

    const totalValue = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear draft
        if (!initialData) {
            localStorage.removeItem('app_transfer_form_state');
        }

        if (!sourceStoreId || !destinationStoreId || items.length === 0) return;
        if (sourceStoreId === destinationStoreId) {
            // Should be prevented by UI but keeping validation
            alert("La tienda de origen y destino no pueden ser la misma.");
            return;
        }

        const sourceStore = stores.find(s => s.id === sourceStoreId);
        const destStore = stores.find(s => s.id === destinationStoreId);

        onSubmit({
            date,
            sourceStoreId,
            sourceStoreName: sourceStore?.name || 'Unknown',
            destinationStoreId,
            destinationStoreName: destStore?.name || 'Unknown',
            items,
            totalValue,
            status: 'completed'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="purchase-form">
            {/* Same layout classes as PurchaseForm since we want it to look "exactly alike" */}
            <div className="purchase-form-main">
                <div className="purchase-form-section">
                    <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Agregar Productos a Transferir</h3>
                    <div className="item-search-wrapper">
                        <Input
                            label="Buscar Producto (Nombre o Código)"
                            placeholder="Escribe para buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                            autoFocus
                            disabled={!sourceStoreId} // Disable search if no source store selected (needed for stock check)
                        />
                        {!sourceStoreId && <div className="text-xs text-muted mt-1">Selecciona una tienda de origen primero.</div>}

                        {searchResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {searchResults.map(product => {
                                    const sourceStock = sourceStoreId ? (product.inventory?.[sourceStoreId] || 0) : 0;
                                    return (
                                        <div
                                            key={product.id}
                                            className="search-result-item"
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-sm text-muted flex justify-between">
                                                <span>{product.barcode}</span>
                                                {sourceStoreId && (
                                                    <span className={sourceStock <= 0 ? "text-danger" : "text-success"}>
                                                        Disp: {sourceStock}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="purchase-form-items">
                    <div className="purchases-table-wrapper">
                        <table className="purchases-table">
                            <thead className="bg-surface-hover sticky top-0">
                                <tr>
                                    <th style={{ padding: '0.75rem' }}>Producto</th>
                                    <th className="table-cell-center" style={{ padding: '0.75rem', width: '120px' }}>Cantidad</th>
                                    <th className="table-cell-center" style={{ padding: '0.75rem', width: '100px' }}>Disponible</th>
                                    <th className="table-cell-right" style={{ padding: '0.75rem' }}>Valor Unit.</th>
                                    <th className="table-cell-right" style={{ padding: '0.75rem' }}>Subtotal</th>
                                    <th style={{ padding: '0.75rem', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Busca y selecciona productos para transferir.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => {
                                        const availableStock = getProductStockInSource(item.productId);
                                        const isLowStock = item.quantity > availableStock;

                                        return (
                                            <tr key={index}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <span>{item.productName}</span>
                                                        {isLowStock && (
                                                            <span className="text-danger font-medium" style={{ fontSize: '0.75rem' }}>
                                                                ⚠ Insuficiente en origen
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="table-cell-center" style={{ padding: '0.5rem' }}>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(index, Number(e.target.value))}
                                                        min="1"
                                                        className={`input-field text-center ${isLowStock ? 'border-danger text-danger' : ''}`}
                                                        style={{ padding: '0.25rem' }}
                                                    />
                                                </td>
                                                <td className="table-cell-center" style={{ padding: '0.5rem' }}>
                                                    <span className={isLowStock ? 'text-danger font-medium' : 'text-muted'}>
                                                        {availableStock}
                                                    </span>
                                                </td>
                                                <td className="table-cell-right" style={{ padding: '0.5rem' }}>
                                                    ${item.unitCost.toFixed(2)}
                                                </td>
                                                <td className="table-cell-right" style={{ padding: '0.75rem', fontWeight: 500 }}>
                                                    ${item.subtotal.toFixed(2)}
                                                </td>
                                                <td className="table-cell-center" style={{ padding: '0.75rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="icon-button-danger"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="purchase-form-sidebar">
                <div className="purchase-details-card">
                    <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-2">Detalles de Transferencia</h3>

                    <div className="sidebar-input-group">
                        <label className="sidebar-label">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="sidebar-input-group">
                        <label className="sidebar-label">Tienda Origen</label>
                        <select
                            value={sourceStoreId}
                            onChange={e => setSourceStoreId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Seleccionar Origen...</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id} disabled={s.id === destinationStoreId}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center my-2 text-muted">
                        <ArrowRight size={20} />
                    </div>

                    <div className="sidebar-input-group">
                        <label className="sidebar-label">Tienda Destino</label>
                        <select
                            value={destinationStoreId}
                            onChange={e => setDestinationStoreId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Seleccionar Destino...</option>
                            {stores.filter(s => s.id !== sourceStoreId).map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="purchase-summary-card">
                    <div className="summary-total">
                        <span className="summary-total-label">Valor Total</span>
                        <span className="summary-total-value">${totalValue.toFixed(2)}</span>
                    </div>

                    <div className="summary-actions">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isProcessing || items.length === 0 || !sourceStoreId || !destinationStoreId}
                            icon={<Save size={18} />}
                        >
                            {isProcessing ? 'Procesando...' : 'Guardar Transferencia'}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={onCancel} disabled={isProcessing}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
