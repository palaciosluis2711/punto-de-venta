import { useState, useEffect } from 'react';
import type { Product } from '../../inventory/types';

export interface CartItem extends Product {
    quantity: number;
    originalPrice: number;
    specialPrice?: number;
    isSpecialPrice?: boolean;
    bundleId?: string;
    manualPrice?: number;
    discount?: {
        type: 'percent' | 'amount';
        value: number;
    };
}

export const useCart = () => {
    // Initialize from localStorage
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('app_pos_cart');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('app_pos_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product, quantity = 1, priceOverride?: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                const shouldUseSpecial = priceOverride !== undefined;
                const updated = {
                    ...existing,
                    quantity: existing.quantity + quantity,
                    specialPrice: priceOverride ?? existing.specialPrice,
                    isSpecialPrice: shouldUseSpecial ? true : existing.isSpecialPrice
                };
                // If price override passed, it effectively sets special price logic
                // But if we want to support manual overrides, we might need to handle that.
                // For now adhering to existing logic but routed through calculator.
                return prev.map(item => item.id === product.id ? recalculateItemPrice(updated) : item);
            }

            const newItem: CartItem = {
                ...product,
                quantity,
                originalPrice: product.price,
                specialPrice: priceOverride,
                isSpecialPrice: priceOverride !== undefined,
                price: 0 // Will be calc below
            };
            return [...prev, recalculateItemPrice(newItem)];
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

    const setItemQuantity = (productId: string, quantity: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const validQty = Math.max(1, quantity);
                return { ...item, quantity: validQty };
            }
            return item;
        }));
    };

    const toggleItemPrice = (productId: string, useSpecial: boolean) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const updated = {
                    ...item,
                    isSpecialPrice: useSpecial
                };
                return recalculateItemPrice(updated);
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('app_pos_cart');
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const updateItem = (productId: string, updates: Partial<CartItem>) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const updatedItem = { ...item, ...updates };
                return recalculateItemPrice(updatedItem);
            }
            return item;
        }));
    };

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setItemQuantity,
        toggleItemPrice,
        updateItem,
        clearCart,
        total
    };
};

const recalculateItemPrice = (item: CartItem): CartItem => {
    // 1. Determine Base Price
    let basePrice = item.originalPrice;
    if (item.manualPrice !== undefined) {
        basePrice = item.manualPrice;
    } else if (item.isSpecialPrice && item.specialPrice !== undefined) {
        basePrice = item.specialPrice;
    }

    // 2. Apply Discount
    let finalPrice = basePrice;
    if (item.discount) {
        if (item.discount.type === 'percent') {
            finalPrice = basePrice * (1 - (item.discount.value / 100));
        } else {
            finalPrice = Math.max(0, basePrice - item.discount.value);
        }
    }

    return {
        ...item,
        price: finalPrice
    };
};
