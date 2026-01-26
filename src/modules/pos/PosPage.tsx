import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useInventory } from '../inventory/hooks/useInventory';
import { useCart } from './hooks/useCart';
import { useClients } from '../clients/hooks/useClients';
import { PosProductList } from './components/PosProductList';
import { PosCart } from './components/PosCart';
import { PosClientSelector } from './components/PosClientSelector';
import { ClientForm } from '../clients/components/ClientForm';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { ProductForm } from '../inventory/components/ProductForm';
import type { Product } from '../inventory/types';
import type { Client } from '../clients/types';
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
    const { clients, searchClients, addClient, updateClient } = useClients();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Client State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

    // Track if we have performed the initial auto-selection
    const hasAutoSelected = React.useRef(false);

    // Wrapper to handle persistence of user preference
    const handleClientSelection = (client: Client | null) => {
        setSelectedClient(client);
        if (client === null) {
            localStorage.setItem('pos_manual_client_deselect', 'true');
            localStorage.removeItem('pos_selected_client_id');
        } else {
            localStorage.removeItem('pos_manual_client_deselect');
            localStorage.setItem('pos_selected_client_id', client.id);
        }
    };

    // Auto-select logic on mount (Prioritize Saved Selection -> Manual Deselect -> Default -> First)
    useEffect(() => {
        if (!hasAutoSelected.current && clients.length > 0) {
            // 1. Try to restore specifically selected client
            const savedClientId = localStorage.getItem('pos_selected_client_id');
            if (savedClientId) {
                const savedClient = clients.find(c => c.id === savedClientId);
                if (savedClient) {
                    setSelectedClient(savedClient);
                    hasAutoSelected.current = true;
                    return;
                }
            }

            // 2. Check if user explicitly deselected
            const wasManuallyDeselected = localStorage.getItem('pos_manual_client_deselect') === 'true';
            if (wasManuallyDeselected) {
                hasAutoSelected.current = true;
                return;
            }

            // 3. Fallback to Default Client
            const defaultClient = clients.find(c => c.isDefault);
            setSelectedClient(defaultClient || clients[0]);
            hasAutoSelected.current = true;
        }
    }, [clients]);

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
        let results = products;

        if (activeStoreId) {
            results = results.filter(p => {
                if (p.inventory && Object.keys(p.inventory).length > 0) {
                    return (p.inventory[activeStoreId] || 0) > 0;
                }
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
            let productsAdded = 0;

            product.associatedProducts.forEach(assoc => {
                let componentProduct = products.find(p => p.id === assoc.productId);

                if (componentProduct) {
                    if (activeStoreId) {
                        componentProduct = {
                            ...componentProduct,
                            stock: componentProduct.inventory?.[activeStoreId] || 0
                        };
                    }

                    let specialUnitPrice = 0;
                    if (assoc.bundlePrice !== undefined && assoc.bundlePrice > 0) {
                        specialUnitPrice = assoc.bundlePrice / assoc.quantity;
                    } else {
                        specialUnitPrice = 0;
                    }

                    const bundlePrice = (assoc as any).bundlePrice;
                    if (bundlePrice !== undefined && bundlePrice >= 0) {
                        specialUnitPrice = bundlePrice / assoc.quantity;
                    } else {
                        if (product.price > 0) {
                            specialUnitPrice = componentProduct.price;
                        }
                    }

                    addToCart(componentProduct, assoc.quantity, specialUnitPrice);
                    productsAdded++;
                }
            });
        } else {
            addToCart(product);
        }
    };

    useEffect(() => {
        if (!searchQuery) return;

        const timer = setTimeout(() => {
            if (filteredProducts.length === 1) {
                addToCartWrapper(filteredProducts[0]);
                setSearchQuery('');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filteredProducts, searchQuery, addToCart]);

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery) {
            e.preventDefault();
            const exactBarcodeMatch = filteredProducts.find(p => p.barcode.toLowerCase() === searchQuery.toLowerCase());

            if (exactBarcodeMatch) {
                addToCartWrapper(exactBarcodeMatch);
                setSearchQuery('');
            } else if (filteredProducts.length === 1) {
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

        // Auto-select default client if none is selected
        let finalClient = selectedClient;
        if (!finalClient && clients.length > 0) {
            finalClient = clients.find(c => c.isDefault) || clients[0];
            setSelectedClient(finalClient); // Update UI to show it was selected
        }

        const clientMsg = finalClient ? `Cliente: ${finalClient.fullName}\n` : '';

        if (confirm(`${clientMsg}¿Proceder al cobro de $${total.toFixed(2)}?`)) {
            const movements = cart.map(item => ({
                productId: item.id,
                storeId: activeStoreId,
                quantity: -item.quantity
            }));

            updateStockBulk(movements);

            alert(`Venta realizada con éxito! ${finalClient ? `(Cliente: ${finalClient.fullName})` : ''}`);
            clearCart();

            // Reset to Default Client for the next sale
            const defaultClient = clients.find(c => c.isDefault) || clients[0] || null;
            setSelectedClient(defaultClient);

            // Reset manual deselect preference on successful checkout so next sale starts with default
            localStorage.removeItem('pos_manual_client_deselect');
            localStorage.removeItem('pos_selected_client_id');
        }
    };

    const handleQuickAdd = (data: Omit<Product, 'id'>) => {
        addProduct(data);
        setIsAddModalOpen(false);
    };

    // Client Handlers
    const handleClientAdd = () => {
        setEditingClient(undefined);
        setIsClientModalOpen(true);
    };

    const handleClientEdit = (client: Client) => {
        setEditingClient(client);
        setIsClientModalOpen(true);
    };

    const handleClientFormSubmit = (data: Omit<Client, 'id'>) => {
        if (editingClient) {
            updateClient(editingClient.id, data);
            // Update local selected state if editing the active one
            if (selectedClient && selectedClient.id === editingClient.id) {
                setSelectedClient({ ...data, id: editingClient.id });
            }
        } else {
            addClient(data);
            // Note: We can't auto-select here easily without knowing the new ID immediately,
            // but the user can search for it immediately.
        }
        setIsClientModalOpen(false);
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

            <div className="pos-sidebar" style={{ width: `${sidebarWidth}px`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 1rem 0 1rem' }}>
                    <PosClientSelector
                        selectedClient={selectedClient}
                        onSelect={handleClientSelection}
                        searchClients={searchClients}
                        onAdd={handleClientAdd}
                        onEdit={handleClientEdit}
                    />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
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

            {/* Client Modal */}
            <Modal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            >
                <ClientForm
                    initialData={editingClient}
                    onSubmit={handleClientFormSubmit}
                    onCancel={() => setIsClientModalOpen(false)}
                />
            </Modal>
        </div>
    );
};
