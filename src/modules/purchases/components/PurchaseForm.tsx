import React, { useState, useEffect, useCallback } from 'react';
import { useStores } from '../../settings/hooks/useStores';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';
import { useInventory } from '../../inventory/hooks/useInventory';
import type { PurchaseItem, Purchase } from '../types';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Search, Trash2, Save } from 'lucide-react';
import type { Product } from '../../inventory/types';

interface PurchaseFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isProcessing?: boolean;
    initialData?: Purchase | null;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSubmit, onCancel, isProcessing, initialData }) => {
    const { stores } = useStores();
    const { suppliers } = useSuppliers();
    const { products } = useInventory(); // Get products directly

    const [storeId, setStoreId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<PurchaseItem[]>([]);

    // Initialize form with data if provided, or from localStorage
    useEffect(() => {
        if (initialData) {
            setStoreId(initialData.storeId);
            setSupplierId(initialData.supplierId);
            const formattedDate = new Date(initialData.date).toISOString().split('T')[0];
            setDate(formattedDate);
            setItems(initialData.items);
        } else {
            // Try to load from localStorage
            const savedState = localStorage.getItem('app_purchase_form_state');
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    setStoreId(parsed.storeId || '');
                    setSupplierId(parsed.supplierId || '');
                    // Date usually defaults to today, but if we want to persist it:
                    if (parsed.date) setDate(parsed.date);
                    if (parsed.items) setItems(parsed.items);
                } catch (e) {
                    console.error("Failed to load purchase draft", e);
                }
            }
        }
    }, [initialData]);

    // Persist state to localStorage
    useEffect(() => {
        if (!initialData) {
            const stateToSave = { storeId, supplierId, date, items };
            localStorage.setItem('app_purchase_form_state', JSON.stringify(stateToSave));
        }
    }, [storeId, supplierId, date, items, initialData]);

    // Item adding state
    const [searchTerm, setSearchTerm] = useState('');
    // Derived state for search results - No useState needed for this
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
        // No need to clear searchResults as it's derived from searchTerm
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

    // Auto-add effect
    useEffect(() => {
        if (searchResults.length === 1 && searchTerm) {
            handleSelectProduct(searchResults[0]);
        }
    }, [searchResults, searchTerm, handleSelectProduct]);

    const handleUpdateItem = (index: number, field: 'quantity' | 'unitCost', value: number) => {
        if (value < 0) return;

        setItems(prev => {
            const updated = [...prev];
            const item = { ...updated[index] };

            if (field === 'quantity') {
                item.quantity = value;
            } else {
                item.unitCost = value;
            }

            item.subtotal = item.quantity * item.unitCost;
            updated[index] = item;
            return updated;
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear draft
        if (!initialData) {
            localStorage.removeItem('app_purchase_form_state');
        }

        if (!storeId || !supplierId || items.length === 0) return;

        const selectedStore = stores.find(s => s.id === storeId);
        const selectedSupplier = suppliers.find(s => s.id === supplierId);

        onSubmit({
            date,
            storeId,
            storeName: selectedStore?.name || 'Unknown',
            supplierId,
            supplierName: selectedSupplier?.name || 'Unknown',
            items,
            total,
            status: 'completed'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="purchase-form">

            {/* LEFT COLUMN: Main Content */}
            <div className="purchase-form-main">
                {/* Search Section */}
                <div className="purchase-form-section">
                    <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Agregar Productos</h3>
                    <div className="item-search-wrapper">
                        <Input
                            label="Buscar Producto (Nombre o Código)"
                            placeholder="Escribe para buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                            autoFocus
                        />
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {searchResults.map(product => (
                                    <div
                                        key={product.id}
                                        className="search-result-item"
                                        onClick={() => handleSelectProduct(product)}
                                    >
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-muted flex justify-between">
                                            <span>{product.barcode}</span>
                                            <span>Costo: ${product.cost}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="purchase-form-items">
                    <div className="purchases-table-wrapper">
                        <table className="purchases-table">
                            <thead className="bg-surface-hover sticky top-0">
                                <tr>
                                    <th style={{ padding: '0.75rem' }}>Producto</th>
                                    <th className="table-cell-center" style={{ padding: '0.75rem', width: '120px' }}>Cantidad</th>
                                    <th className="table-cell-right" style={{ padding: '0.75rem', width: '150px' }}>Costo Unit.</th>
                                    <th className="table-cell-right" style={{ padding: '0.75rem' }}>Subtotal</th>
                                    <th style={{ padding: '0.75rem', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Busca y selecciona productos para agregarlos.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '0.75rem' }}>{item.productName}</td>
                                            <td className="table-cell-center" style={{ padding: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                                                    min="1"
                                                    className="input-field text-center"
                                                    style={{ padding: '0.25rem' }}
                                                />
                                            </td>
                                            <td className="table-cell-right" style={{ padding: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={item.unitCost}
                                                    onChange={(e) => handleUpdateItem(index, 'unitCost', Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    className="input-field text-right"
                                                    style={{ padding: '0.25rem' }}
                                                />
                                            </td>
                                            <td className="table-cell-right" style={{ padding: '0.75rem', fontWeight: 500 }}>${item.subtotal.toFixed(2)}</td>
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Sidebar (Details & Summary) */}
            <div className="purchase-form-sidebar">
                {/* Check: Details Card */}
                <div className="purchase-details-card">
                    <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-2">Detalles de Compra</h3>

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
                        <label className="sidebar-label">Proveedor</label>
                        <select
                            value={supplierId}
                            onChange={e => setSupplierId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sidebar-input-group">
                        <label className="sidebar-label">Tienda Destino</label>
                        <select
                            value={storeId}
                            onChange={e => setStoreId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer: Summary & Actions */}
                <div className="purchase-summary-card">
                    <div className="summary-total">
                        <span className="summary-total-label">Total</span>
                        <span className="summary-total-value">${total.toFixed(2)}</span>
                    </div>

                    <div className="summary-actions">
                        <Button type="submit" className="w-full" disabled={isProcessing || items.length === 0 || !storeId || !supplierId} icon={<Save size={18} />}>
                            {isProcessing ? 'Procesando...' : 'Finalizar Compra'}
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
