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
import { PosFinalizeSaleModal, type FinalizeSaleData } from './components/PosFinalizeSaleModal';
import { PostSaleView } from './components/PostSaleView';
import { PosStockWarningModal, type MissingStockItem, type MissingItemResolution } from './components/PosStockWarningModal';
import { useSales } from '../sales/hooks/useSales';
import { useStores } from '../settings/hooks/useStores';
import { useTransfers } from '../transfers/hooks/useTransfers';
import { useNotifications } from '../notifications/hooks/useNotifications';
import type { Sale } from '../sales/types';
import { useToast } from '../../shared/components/Toast/useToast';
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
    const { addSale } = useSales();
    const { stores } = useStores();
    const { addTransfer } = useTransfers();
    const { addNotification } = useNotifications();
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Client State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

    // Finalize Sale Modal State
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

    // Stock Warning Modal State
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [missingItems, setMissingItems] = useState<MissingStockItem[]>([]);

    // Post Sale Modal State
    const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(() => {
        const saved = localStorage.getItem('pos_last_completed_sale');
        return saved ? JSON.parse(saved) : null;
    });
    const [isPostSaleModalOpen, setIsPostSaleModalOpen] = useState(() => {
        return !!localStorage.getItem('pos_last_completed_sale');
    });

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

    const handleCheckoutClick = () => {
        if (!activeStoreId) {
            alert("Error: No se ha detectado una tienda activa para descontar inventario.");
            return;
        }

        // Auto-select default client if none is selected
        if (!selectedClient && clients.length > 0) {
            const defaultClient = clients.find(c => c.isDefault) || clients[0];
            setSelectedClient(defaultClient);
        }

        // Check for missing stock
        const missing: MissingStockItem[] = [];
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const localStock = product.inventory?.[activeStoreId] || 0;
                if (item.quantity > localStock) {
                    missing.push({
                        product,
                        cartQuantity: item.quantity,
                        localStock,
                        missingQuantity: item.quantity - localStock
                    });
                }
            }
        });

        if (missing.length > 0) {
            setMissingItems(missing);
            setIsWarningModalOpen(true);
        } else {
            setIsFinalizeModalOpen(true);
        }
    };

    const handleProceedWithTransfers = (resolutions: MissingItemResolution[]) => {
        setIsWarningModalOpen(false);

        // Process transfers
        const activeStoreName = stores.find(s => s.id === activeStoreId)?.name || 'Tienda Actual';

        // Group resolutions by source store
        const groupedBySource = resolutions.reduce((acc, res) => {
            if (!acc[res.sourceStoreId]) acc[res.sourceStoreId] = [];
            acc[res.sourceStoreId].push(res);
            return acc;
        }, {} as Record<string, MissingItemResolution[]>);

        const inventoryMovements: { productId: string; storeId: string; quantity: number }[] = [];

        Object.entries(groupedBySource).forEach(([sourceStoreId, items]) => {
            const sourceStoreName = stores.find(s => s.id === sourceStoreId)?.name || 'Tienda Origen';

            const transferItems = items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.transferredQuantity,
                unitCost: item.unitPrice,
                subtotal: item.transferredQuantity * item.unitPrice
            }));

            // Create transfer record
            const createdTransfer = addTransfer({
                date: new Date().toISOString(),
                sourceStoreId,
                sourceStoreName,
                destinationStoreId: activeStoreId,
                destinationStoreName: activeStoreName,
                items: transferItems,
                totalValue: transferItems.reduce((sum, i) => sum + i.subtotal, 0),
                status: 'completed',
                notes: 'Transferencia automática por falta de stock en POS.'
            });

            // Prepare inventory movements
            items.forEach(item => {
                // Deduct from source store
                inventoryMovements.push({
                    productId: item.productId,
                    storeId: sourceStoreId,
                    quantity: -item.transferredQuantity
                });
                // Add to active store (so the sale can deduct it normally)
                inventoryMovements.push({
                    productId: item.productId,
                    storeId: activeStoreId,
                    quantity: item.transferredQuantity
                });
            });

            // Send notification
            const transferredList = items.map(i => {
                let text = `- ${i.productName} (Cant: ${i.transferredQuantity})`;
                if (i.transferredQuantity < i.requestedQuantity) {
                    text += `\n  *Nota: Se requirieron ${i.requestedQuantity} pero solo se transfirieron ${i.transferredQuantity} por falta de stock. Tu inventario quedó en 0.*`;
                }
                return text;
            }).join('\n');

            addNotification({
                title: 'Transferencia Automática de Stock',
                message: `${activeStoreName} vendió productos que no estaban disponibles en su stock, por lo que han pedido transferirlos desde esta tienda para completar la venta.\n\nLos productos transferidos fueron:\n${transferredList}`,
                sourceStoreId: activeStoreId,
                targetStoreId: sourceStoreId,
                priority: 'normal',
                type: 'transfer',
                relatedEntityId: createdTransfer.id
            });
        });

        if (inventoryMovements.length > 0) {
            updateStockBulk(inventoryMovements);
        }

        // Open checkout modal
        setIsFinalizeModalOpen(true);
    };

    const handleFinalizeSale = (data: FinalizeSaleData) => {
        const movements = cart.map(item => ({
            productId: item.id,
            storeId: activeStoreId,
            quantity: -item.quantity
        }));

        updateStockBulk(movements);

        // Create Sale Object
        const newSale: Sale = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            total: data.finalTotal,
            items: cart.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity,
                isSpecialPrice: item.isSpecialPrice,
                unitCost: item.cost
            })),
            paymentMethod: data.paymentMethod,
            clientName: selectedClient ? selectedClient.fullName : 'Cliente General',
            storeId: activeStoreId,
            storeName: stores.find(s => s.id === activeStoreId)?.name || 'Tienda Principal',
            notes: data.notes,
            discount: data.discount.type === 'fixed' ? data.discount.value : (total * data.discount.value / 100),
            shipping: data.shipping,
            receivedAmount: data.receivedAmount,
            change: data.change,
            status: 'completed'
        };

        // Save Sale
        addSale(newSale);

        // Store sale for preview and Open Preview Modal
        setLastCompletedSale(newSale);
        setIsPostSaleModalOpen(true);
        localStorage.setItem('pos_last_completed_sale', JSON.stringify(newSale));

        // Clear Cart and Close Finalize Modal
        clearCart();
        setIsFinalizeModalOpen(false);
        showToast('Venta procesada con éxito', 'success');

        // Reset to Default Client for the next sale (will be ready when modal closes)
        const defaultClient = clients.find(c => c.isDefault) || clients[0] || null;
        setSelectedClient(defaultClient);

        // Reset manual deselect preference
        localStorage.removeItem('pos_manual_client_deselect');
        localStorage.removeItem('pos_selected_client_id');
    };

    const handlePostSaleClose = () => {
        setIsPostSaleModalOpen(false);
        setLastCompletedSale(null);
        localStorage.removeItem('pos_last_completed_sale');
        // Focus search input if possible, or just be ready
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
            addClient({ ...data, storeId: activeStoreId });
            // Note: We can't auto-select here easily without knowing the new ID immediately,
            // but the user can search for it immediately.
        }
        setIsClientModalOpen(false);
    };


    return (
        <div className="pos-layout animate-in fade-in duration-300" style={{ paddingTop: '0.625rem' }}>
            <div className="pos-main" style={{ paddingTop: '2.5rem' }}>
                <div className="pos-search-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder="Buscar producto por nombre o código de barras..."
                            icon={<Search size={20} />}
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
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

            <div className="pos-sidebar" style={{ width: `${sidebarWidth}px`, display: 'flex', flexDirection: 'column', paddingTop: '1.5rem' }}>
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
                        onCheckout={handleCheckoutClick}
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

            {/* Finalize Sale Modal */}
            <PosStockWarningModal
                isOpen={isWarningModalOpen}
                missingItems={missingItems}
                stores={stores}
                activeStoreId={activeStoreId}
                onCancel={() => setIsWarningModalOpen(false)}
                onProceed={handleProceedWithTransfers}
            />

            <PosFinalizeSaleModal
                isOpen={isFinalizeModalOpen}
                onClose={() => setIsFinalizeModalOpen(false)}
                onConfirm={handleFinalizeSale}
                total={total}
                client={selectedClient}
            />

            {/* Post Sale Preview View */}
            <PostSaleView
                isOpen={isPostSaleModalOpen}
                onClose={handlePostSaleClose}
                sale={lastCompletedSale}
            />
        </div>
    );
};
