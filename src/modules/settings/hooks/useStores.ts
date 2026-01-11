import { useState, useEffect } from 'react';

export interface Store {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    isDefault?: boolean;
}

const STORAGE_KEY = 'stationery_stores';

const DEFAULT_STORES: Store[] = [
    { id: '1', name: 'Tienda Principal', address: 'Calle Principal #123', isDefault: true }
];

export const useStores = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeStoreId, setActiveStoreId] = useState<string>('');

    useEffect(() => {
        const loadStores = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            let loadedStores: Store[] = [];
            if (stored) {
                loadedStores = JSON.parse(stored);
                setStores(loadedStores);
            } else {
                loadedStores = DEFAULT_STORES;
                setStores(DEFAULT_STORES);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STORES));
            }

            // Load Active Store logic
            const storedActiveId = localStorage.getItem('stationery_active_store');
            if (storedActiveId && loadedStores.find(s => s.id === storedActiveId)) {
                setActiveStoreId(storedActiveId);
            } else {
                // Default to the Main Store if no active store is set or valid
                const mainStore = loadedStores.find(s => s.isDefault);
                if (mainStore) {
                    setActiveStoreId(mainStore.id);
                    localStorage.setItem('stationery_active_store', mainStore.id);
                } else if (loadedStores.length > 0) {
                    // Fallback to first store if no main store
                    setActiveStoreId(loadedStores[0].id);
                    localStorage.setItem('stationery_active_store', loadedStores[0].id);
                }
            }

            setLoading(false);
        };
        loadStores();
    }, []);

    const saveStores = (newStores: Store[]) => {
        setStores(newStores);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStores));
    };

    const setActiveStore = (id: string) => {
        setActiveStoreId(id);
        localStorage.setItem('stationery_active_store', id);
    };

    const setMainStore = (id: string) => {
        const updated = stores.map(s => ({
            ...s,
            isDefault: s.id === id
        }));
        saveStores(updated);
    };

    const addStore = (name: string, address?: string, phone?: string, isMain: boolean = false) => {
        const newStore: Store = {
            id: crypto.randomUUID(),
            name,
            address,
            phone,
            isDefault: isMain || stores.length === 0
        };

        let updatedStores = [...stores, newStore];

        if (newStore.isDefault) {
            updatedStores = updatedStores.map(s => ({
                ...s,
                isDefault: s.id === newStore.id
            }));
        }

        saveStores(updatedStores);
        return newStore;
    };

    const updateStore = (id: string, updates: Partial<Store>) => {
        let updatedStores = stores.map(s => s.id === id ? { ...s, ...updates } : s);

        if (updates.isDefault) {
            updatedStores = updatedStores.map(s => ({
                ...s,
                isDefault: s.id === id
            }));
        }

        saveStores(updatedStores);
    };

    const deleteStore = (id: string) => {
        const updated = stores.filter(s => s.id !== id);
        saveStores(updated);
    };

    return {
        stores,
        loading,
        activeStoreId,
        setActiveStore,
        addStore,
        updateStore,
        deleteStore,
        setMainStore
    };
};
