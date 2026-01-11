import { useState, useEffect } from 'react';
import type { Transfer } from '../types';

const STORAGE_KEY = 'stationery_transfers';

export const useTransfers = () => {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setTransfers(JSON.parse(stored));
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const addTransfer = (transfer: Omit<Transfer, 'id' | 'createdAt'>) => {
        const newTransfer: Transfer = {
            ...transfer,
            id: crypto.randomUUID(),
            createdAt: Date.now()
        };
        const updated = [newTransfer, ...transfers];
        setTransfers(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newTransfer;
    };

    const updateTransfer = (id: string, updates: Partial<Transfer>) => {
        const updated = transfers.map(t => t.id === id ? { ...t, ...updates } : t);
        setTransfers(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return {
        transfers,
        loading,
        addTransfer,
        updateTransfer
    };
};
