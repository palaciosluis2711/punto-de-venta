import { useState, useEffect } from 'react';
import type { Product } from '../types';

const STORAGE_KEY = 'stationery_inventory';

const MOCK_DATA: Product[] = [
    { id: '1', name: 'Cuaderno Profesional Scribe', barcode: '750123456789', price: 25.50, cost: 18.00, stock: 50, category: 'Papel' },
    { id: '2', name: 'Bolígrafo BIC Cristal Azul', barcode: '750987654321', price: 5.00, cost: 2.50, stock: 200, category: 'Escritura' },
    { id: '3', name: 'Lápiz Adhesivo Pritt 42g', barcode: '750567891234', price: 35.00, cost: 28.00, stock: 30, category: 'Adhesivos' },
];

export const useInventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setProducts(JSON.parse(stored));
            } else {
                // Initialize with mock data if empty
                setProducts(MOCK_DATA);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
            }
            setLoading(false);
        };

        loadData();
    }, []);

    const saveProducts = (newProducts: Product[]) => {
        setProducts(newProducts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
    };

    const addProduct = (product: Omit<Product, 'id'>) => {
        const newProduct = { ...product, id: crypto.randomUUID() };
        const updated = [...products, newProduct];
        saveProducts(updated);
    };

    const updateProduct = (id: string, updates: Partial<Product>) => {
        const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
        saveProducts(updated);
    };

    const deleteProduct = (id: string) => {
        const updated = products.filter(p => p.id !== id);
        saveProducts(updated);
    };

    const getProductByBarcode = (barcode: string) => {
        return products.find(p => p.barcode === barcode);
    };

    const searchProducts = (query: string) => {
        const lower = query.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.barcode.includes(lower)
        );
    };

    return {
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductByBarcode,
        searchProducts
    };
};
