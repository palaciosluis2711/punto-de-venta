import { useState, useEffect } from 'react';
import type { Sale } from '../types';

const STORAGE_KEY = 'app_sales';

export const useSales = () => {
    const [sales, setSales] = useState<Sale[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    }, [sales]);

    const addSale = (sale: Sale) => {
        setSales(prev => [sale, ...prev]);
    };

    return {
        sales,
        addSale
    };
};
