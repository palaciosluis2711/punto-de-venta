import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useInventory } from '../hooks/useInventory';
import { Search } from 'lucide-react';
import type { Product } from '../types';

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product, quantity: number, price: number) => void;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { products } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [bundlePrice, setBundlePrice] = useState(0);

    const searchResults = React.useMemo(() => {
        if (!searchTerm) return [];
        const lower = searchTerm.toLowerCase();
        return products.filter(p =>
            (p.name.toLowerCase().includes(lower) || p.barcode.includes(lower)) &&
            (!p.associatedProducts || p.associatedProducts.length === 0) // Filter out bundles
        ).slice(0, 50); // Increased limit to allow scrolling
    }, [searchTerm, products]);

    const handleSelect = (product: Product) => {
        setSelectedProduct(product);
        setBundlePrice(product.price * quantity); // Default to standard total
        setSearchTerm('');
    };

    const handleConfirm = () => {
        if (selectedProduct && quantity > 0) {
            onSelect(selectedProduct, quantity, bundlePrice);
            // Reset state
            setSelectedProduct(null);
            setQuantity(1);
            setBundlePrice(0);
            setSearchTerm('');
            onClose();
        }
    };

    const handleClose = () => {
        setSelectedProduct(null);
        setQuantity(1);
        setBundlePrice(0);
        setSearchTerm('');
        onClose();
    };

    // Update price when quantity changes if it was matching standard price? 
    // Or just let user edit it manually?
    // Let's auto-update if it seems they haven't customized it yet, or just provide a helper.
    // Simpler: Just update default price when quantity changes IF product is selected
    React.useEffect(() => {
        if (selectedProduct) {
            // For UX, maybe we shouldn't force overwrite if they typed something custom.
            // But initializing is good.
            // Let's just set a default if bundlePrice is 0?
        }
    }, [quantity, selectedProduct]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Asociar Producto">
            <div className="flex flex-col gap-4" style={{ minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!selectedProduct ? (
                    <div>
                        <div className="relative">
                            <Input
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                icon={<Search size={18} />}
                                autoFocus
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-border mt-1 rounded-md shadow-lg z-10"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        marginTop: '0.25rem',
                                        borderRadius: 'var(--radius)',
                                        zIndex: 50,
                                        maxHeight: '200px', // Limit height
                                        overflowY: 'auto'   // Enable scrolling
                                    }}>
                                    {searchResults.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleSelect(p)}
                                            className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                            style={{ padding: '0.75rem', cursor: 'pointer' }}
                                        >
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-muted">{p.barcode}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {searchTerm && searchResults.length === 0 && (
                            <p className="text-sm text-muted mt-2 text-center">No se encontraron productos disponibles.</p>
                        )}
                    </div>
                ) : (
                    <div className="bg-muted/10 p-4 rounded-md border border-border" style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div className="mb-4">
                            <label className="text-xs text-muted font-medium uppercase tracking-wider">Producto Seleccionado</label>
                            <div className="font-medium text-lg text-primary">{selectedProduct.name}</div>
                            <div className="text-sm text-muted">{selectedProduct.barcode}</div>
                            <Button variant="ghost" size="sm" className="mt-1 h-auto p-0 text-primary" onClick={() => setSelectedProduct(null)}>
                                Cambiar
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Input
                                type="number"
                                label="Cantidad"
                                value={quantity}
                                onChange={e => {
                                    const newQty = Number(e.target.value);
                                    setQuantity(newQty);
                                    // Auto-update price estimate
                                    if (selectedProduct) setBundlePrice(selectedProduct.price * newQty);
                                }}
                                min={0.01}
                                step={0.01}
                                autoFocus
                            />

                            <Input
                                type="number"
                                label="Precio Total en Paquete"
                                value={bundlePrice}
                                onChange={e => setBundlePrice(Number(e.target.value))}
                                min={0}
                                step={0.01}
                            />
                            <div className="text-xs text-muted text-right">
                                Precio Normal Total: ${(selectedProduct.price * quantity).toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedProduct || quantity <= 0}>
                        Asociar Stock
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
