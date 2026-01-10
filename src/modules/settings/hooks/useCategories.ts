import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stationery_categories';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Papel' },
    { id: '2', name: 'Escritura' },
    { id: '3', name: 'Adhesivos' },
    { id: '4', name: 'Arte' },
    { id: '5', name: 'Oficina' }
];

export interface Category {
    id: string;
    name: string;
    description?: string;
}

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const load = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setCategories(JSON.parse(stored));
            } else {
                setCategories(DEFAULT_CATEGORIES);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
            }
        };
        load();
    }, []);

    const save = (newCategories: Category[]) => {
        setCategories(newCategories);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
    };

    const addCategory = (name: string, description?: string) => {
        const newCategory = { id: crypto.randomUUID(), name, description };
        save([...categories, newCategory]);
    };

    const updateCategory = (id: string, name: string, description?: string) => {
        save(categories.map(c => c.id === id ? { ...c, name, description } : c));
    };

    const deleteCategory = (id: string) => {
        save(categories.filter(c => c.id !== id));
    };

    return {
        categories,
        addCategory,
        updateCategory,
        deleteCategory
    };
};
