import React, { useState } from 'react';
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

export const PosPage: React.FC = () => {
    const { products, searchProducts, addProduct, updateProduct } = useInventory();
    const {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total
    } = useCart();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Real-time filtering
    const filteredProducts = searchQuery ? searchProducts(searchQuery) : products;

    const handleCheckout = () => {
        if (confirm(`¿Proceder al cobro de $${total.toFixed(2)}?`)) {
            // Simulate transaction: Deduct stock
            cart.forEach(item => {
                const product = products.find(p => p.id === item.id);
                if (product) {
                    updateProduct(product.id, { stock: product.stock - item.quantity });
                }
            });

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
                        onAdd={addToCart}
                    />
                </div>
            </div>

            <div className="pos-sidebar">
                <PosCart
                    cart={cart}
                    total={total}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    onCheckout={handleCheckout}
                />
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Añadir Producto Rápido"
            >
                <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <ProductForm
                        onSubmit={handleQuickAdd}
                        onCancel={() => setIsAddModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
};
