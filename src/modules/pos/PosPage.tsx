import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useInventory } from '../inventory/hooks/useInventory';
import { useCart } from './hooks/useCart';
import { PosProductList } from './components/PosProductList';
import { PosCart } from './components/PosCart';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { ProductForm } from '../inventory/components/ProductForm';
import type { Product } from '../inventory/types';
import './PosPage.css';

import { useOutletContext } from 'react-router-dom';

export const PosPage: React.FC = () => {
    const { activeStoreId } = useOutletContext<{ activeStoreId: string }>();
    const { products, searchProducts, addProduct, updateStockBulk } = useInventory();
    const {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setItemQuantity,
        updateItem,
        clearCart,
        toggleItemPrice,
        total
    } = useCart();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Sidebar Resize Logic
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('pos_sidebar_width');
        return saved ? Number(saved) : 400;
    });
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        localStorage.setItem('pos_sidebar_width', sidebarWidth.toString());
    }, [sidebarWidth]);

    const startResizing = React.useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing) {
            // Sidebar is on the right, so width is (Window Width - Mouse X)
            // But we are in a flex container, simpler is to use movement from right edge.
            // Or just: New Width = Window Width - Mouse X.
            // Assuming the sidebar is right-aligned in full screen logic.
            const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
            if (newWidth > 250 && newWidth < 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // Derived state for filtered products
    const filteredProducts = React.useMemo(() => {
        // First filter by Active Store (if valid activeStoreId matches inventory)
        // If inventory is missing or empty, we assume it's NOT in the store (or we need a way to assign it). 
        // For this MVP, let's assume global visibility if no specific inventory is set, 
        // OR strictly filter if inventory exists.
        // User request: "only products of that store".
        // Let's iterate: Show product IF:
        // 1. It matches search query (if any)
        // AND
        // 2. It has stock > 0 in activeStoreId (real inventory check)
        // OR
        // 3. It serves as a fallback for the "Main Store" if we treat Main as default?
        // Let's stick to strict inventory check: (p.inventory?.[activeStoreId] || 0) > 0

        let results = products;

        // Filter by Store Availability (Mocking "Global" if no inventory system used yet? No, better be strict or the feature is meaningless)
        // However, existing data (mock) has no inventory. I should probably allow all for now if inventory is undefined, 
        // to avoid empty POS on first load.
        // Better strategy: Filter by store ONLY if inventory object has keys.
        if (activeStoreId) {
            results = results.filter(p => {
                // If product has comprehensive inventory tracking
                if (p.inventory && Object.keys(p.inventory).length > 0) {
                    return (p.inventory[activeStoreId] || 0) > 0;
                }
                // If it's a legacy product/mock without detailed inventory, show it for now
                // to avoid breaking the demo.
                return true;
            });
        }

        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.barcode.includes(lower)
            );
        }

        // Override stock with Store Specific Stock for display and logic
        if (activeStoreId) {
            results = results.map(p => ({
                ...p,
                stock: p.inventory?.[activeStoreId] || 0
            }));
        }

        return results;
    }, [searchQuery, products, searchProducts, activeStoreId]);

    const addToCartWrapper = (product: Product) => {
        if (product.associatedProducts && product.associatedProducts.length > 0) {
            // It's a special product container/bundle
            let productsAdded = 0;

            product.associatedProducts.forEach(assoc => {
                let componentProduct = products.find(p => p.id === assoc.productId);

                if (componentProduct) {
                    // Important: Override stock with store specific stock for the component too
                    if (activeStoreId) {
                        componentProduct = {
                            ...componentProduct,
                            stock: componentProduct.inventory?.[activeStoreId] || 0
                        };
                    }
                    // Determine special unit price from the bundle configuration
                    // If bundlePrice is set, unit price is bundlePrice / quantity
                    // Fallback to 0 or ratio? 
                    // Since we refactored to explicit pricing, let's look for bundlePrice.
                    // If migration happened, it might be 0.

                    let specialUnitPrice = 0;
                    if (assoc.bundlePrice !== undefined && assoc.bundlePrice > 0) {
                        specialUnitPrice = assoc.bundlePrice / assoc.quantity;
                    } else {
                        // Fallback for legacy or unpriced bundles: Keep original price? 
                        // Or try to calculate ratio? User said "price field in bundle form no longer needed".
                        // Use component original price if no bundle price defined?
                        // Or maybe the ratio of product.price / total? 
                        // Safer to fallback to ratio if product.price > 0, otherwise component price.

                        // Let's implement robust fallback:
                        // If product.price (bundle total) is > 0, we can try to distribute it.
                        // But strictly per request: use the defined price.
                        // If 0, then it's free in the bundle?
                        specialUnitPrice = 0;
                    }

                    // We need to cast assoc to access bundlePrice if Typescript complains, 
                    // but we updated types.ts so it should be fine.
                    // However, at runtime, old data might not have it.

                    // Force type assertion if needed or just access property
                    const bundlePrice = (assoc as any).bundlePrice;

                    if (bundlePrice !== undefined && bundlePrice >= 0) {
                        specialUnitPrice = bundlePrice / assoc.quantity;
                    } else {
                        // Fallback: Ratio based distribution (legacy behavior support)
                        // Calculate this ONLY if needed to avoid overhead
                        // For now, let's assume new bundles have price.
                        // But for existing ones, we might break pricing. 
                        // Check if `product.price` is set.
                        if (product.price > 0) {
                            // Re-calc standard total for ratio
                            // optimized: calculate ratio once if needed?
                            // Let's simplified: If explicit price exists, use it.
                            specialUnitPrice = componentProduct.price; // Default to normal if undefined
                        }
                    }

                    addToCart(componentProduct, assoc.quantity, specialUnitPrice);
                    productsAdded++;
                }
            });

            if (productsAdded > 0) {
                // Optional: Show a toast? 
            }
        } else {
            // Normal product
            addToCart(product);
        }
    };

    // Auto-add effect with Debounce
    // We strictly wait for the user to stop typing to avoid "Prefix" issues (e.g. typing '1234' but '123' matches).
    useEffect(() => {
        if (!searchQuery) return;

        const timer = setTimeout(() => {
            // Only auto-add if there is exactly one match
            if (filteredProducts.length === 1) {
                addToCartWrapper(filteredProducts[0]);
                setSearchQuery('');
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [filteredProducts, searchQuery, addToCart]);

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery) {
            e.preventDefault();

            // Prioritize Exact Barcode Match on Enter
            const exactBarcodeMatch = filteredProducts.find(p => p.barcode.toLowerCase() === searchQuery.toLowerCase());

            if (exactBarcodeMatch) {
                addToCartWrapper(exactBarcodeMatch);
                setSearchQuery('');
            } else if (filteredProducts.length === 1) {
                // Determine if unique match
                addToCartWrapper(filteredProducts[0]);
                setSearchQuery('');
            }
        }
    };

    const handleCheckout = () => {
        if (!activeStoreId) {
            alert("Error: No se ha detectado una tienda activa para descontar inventario.");
            return;
        }

        if (confirm(`¿Proceder al cobro de $${total.toFixed(2)}?`)) {
            // Deduct stock using bulk update
            const movements = cart.map(item => ({
                productId: item.id,
                storeId: activeStoreId,
                quantity: -item.quantity
            }));

            updateStockBulk(movements);

            alert('Venta realizada con éxito!');
            clearCart();
        }
    };

    const handleQuickAdd = (data: Omit<Product, 'id'>) => {
        addProduct(data);
        setIsAddModalOpen(false);
        // Optionally auto-add to cart or focus search
    };



    return (
        <div className="pos-layout">
            <div className="pos-main">
                <div className="pos-search-bar" style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder="Buscar producto por nombre o código de barras..."
                            icon={<Search size={20} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            autoFocus
                            className="search-input-lg"
                        />
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        title="Añadir Producto Rápido"
                        style={{ height: '44px', width: '44px', padding: 0, justifyContent: 'center' }}
                    >
                        <Plus size={24} />
                    </Button>
                </div>

                <div className="pos-content">
                    <PosProductList
                        products={filteredProducts}
                        onAdd={addToCartWrapper}
                    />
                </div>
            </div>

            {/* Resizer Handle */}
            <div
                className="pos-resizer"
                onMouseDown={startResizing}
                style={{
                    width: '6px',
                    cursor: 'col-resize',
                    backgroundColor: isResizing ? 'var(--primary)' : 'transparent',
                    borderLeft: '1px solid var(--border)',
                    transition: 'background-color 0.2s',
                    zIndex: 10
                }}
            />

            <div className="pos-sidebar" style={{ width: `${sidebarWidth}px` }}>
                <PosCart
                    cart={cart}
                    total={total}
                    onUpdateQuantity={updateQuantity}
                    onSetQuantity={setItemQuantity}
                    onRemove={removeFromCart}
                    onCheckout={handleCheckout}
                    onTogglePrice={toggleItemPrice}
                    onUpdateItem={updateItem}
                />
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Añadir Producto Rápido"
            >
                <div style={{ paddingRight: '0.5rem' }}>
                    <ProductForm
                        onSubmit={handleQuickAdd}
                        onCancel={() => setIsAddModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
};
