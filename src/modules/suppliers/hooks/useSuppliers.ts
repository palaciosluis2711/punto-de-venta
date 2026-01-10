import { useState, useEffect } from 'react';
import type { Supplier } from '../types';

const STORAGE_KEY = 'stationery_suppliers';

const MOCK_DATA: Supplier[] = [
    {
        id: '1',
        name: 'Distribuidora Papelera S.A. de C.V.',
        email: 'contacto@dispap.com',
        phone: '55 1234 5678',
        address: 'Av. Industrial 123, CDMX',
        image: 'https://via.placeholder.com/50'
    },
    {
        id: '2',
        name: 'Comercializadora Escolar',
        email: 'ventas@comescolar.com',
        phone: '33 9876 5432',
        address: 'Calle Reforma 456, GDL'
    },
];

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSuppliers(JSON.parse(stored));
            } else {
                setSuppliers(MOCK_DATA);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
            }
            setLoading(false);
        };

        loadData();
    }, []);

    const saveSuppliers = (newSuppliers: Supplier[]) => {
        setSuppliers(newSuppliers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSuppliers));
    };

    const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
        const newSupplier = { ...supplier, id: crypto.randomUUID() };
        const updated = [...suppliers, newSupplier];
        saveSuppliers(updated);
    };

    const updateSupplier = (id: string, updates: Partial<Supplier>) => {
        const updated = suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
        saveSuppliers(updated);
    };

    const deleteSupplier = (id: string) => {
        const updated = suppliers.filter(s => s.id !== id);
        saveSuppliers(updated);
    };

    const deleteSuppliers = (ids: string[]) => {
        const updated = suppliers.filter(s => !ids.includes(s.id));
        saveSuppliers(updated);
    };

    const searchSuppliers = (query: string) => {
        const lower = query.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(lower) ||
            s.email?.toLowerCase().includes(lower)
        );
    };

    return {
        suppliers,
        loading,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        searchSuppliers,
        deleteSuppliers
    };
};
