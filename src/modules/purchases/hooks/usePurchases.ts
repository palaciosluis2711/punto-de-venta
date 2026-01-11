import { useState, useEffect } from 'react';
import type { Purchase } from '../types';

const STORAGE_KEY = 'stationery_purchases';

export const usePurchases = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setPurchases(JSON.parse(stored));
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const addPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
        const newPurchase: Purchase = {
            ...purchase,
            id: crypto.randomUUID(),
            createdAt: Date.now()
        };
        const updated = [newPurchase, ...purchases];
        setPurchases(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newPurchase;
    };

    const updatePurchase = (id: string, updates: Partial<Purchase>) => {
        const updated = purchases.map(p => p.id === id ? { ...p, ...updates } : p);
        setPurchases(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return {
        purchases,
        loading,
        addPurchase,
        updatePurchase
    };
};
