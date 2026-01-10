import { useState } from 'react';
import type { Product } from '../../inventory/types';

export interface CartItem extends Product {
    quantity: number;
}

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            });
        });
    };

    const clearCart = () => setCart([]);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total
    };
};
