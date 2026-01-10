import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stationery_brands';

const DEFAULT_BRANDS = [
    { id: '1', name: 'Scribe', description: 'Cuadernos y papel' },
    { id: '2', name: 'Bic', description: 'Bolígrafos y escritura' },
    { id: '3', name: 'Norma', description: 'Colores y cuadernos' },
    { id: '4', name: 'Pritt', description: 'Adhesivos' }
];

export interface Brand {
    id: string;
    name: string;
    description?: string;
    image?: string;
}

export const useBrands = () => {
    const [brands, setBrands] = useState<Brand[]>([]);

    useEffect(() => {
        const load = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setBrands(JSON.parse(stored));
            } else {
                setBrands(DEFAULT_BRANDS);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRANDS));
            }
        };
        load();
    }, []);

    const save = (newBrands: Brand[]) => {
        setBrands(newBrands);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBrands));
    };

    const addBrand = (name: string, description?: string, image?: string) => {
        const newBrand = { id: crypto.randomUUID(), name, description, image };
        save([...brands, newBrand]);
    };

    const updateBrand = (id: string, name: string, description?: string, image?: string) => {
        save(brands.map(b => b.id === id ? { ...b, name, description, image } : b));
    };

    const deleteBrand = (id: string) => {
        save(brands.filter(b => b.id !== id));
    };

    return {
        brands,
        addBrand,
        updateBrand,
        deleteBrand
    };
};
