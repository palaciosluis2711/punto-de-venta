import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stationery_units';

const DEFAULT_UNITS = [
    { id: '1', name: 'Unidad', abbreviation: 'pza' },
    { id: '2', name: 'Paquete', abbreviation: 'paq', is_composite: true },
    { id: '3', name: 'Caja', abbreviation: 'caja', is_composite: true },
    { id: '4', name: 'Kilogramo', abbreviation: 'kg' },
    { id: '5', name: 'Metro', abbreviation: 'm' }
];

export interface Unit {
    id: string;
    name: string;
    abbreviation?: string;
    is_composite?: boolean;
}

export const useUnits = () => {
    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => {
        const load = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setUnits(JSON.parse(stored));
            } else {
                setUnits(DEFAULT_UNITS);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UNITS));
            }
        };
        load();
    }, []);

    const save = (newUnits: Unit[]) => {
        setUnits(newUnits);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUnits));
    };

    const addUnit = (name: string, abbreviation?: string, is_composite: boolean = false) => {
        const newUnit = { id: crypto.randomUUID(), name, abbreviation, is_composite };
        save([...units, newUnit]);
    };

    const updateUnit = (id: string, name: string, abbreviation?: string, is_composite?: boolean) => {
        save(units.map(u => u.id === id ? { ...u, name, abbreviation, is_composite } : u));
    };

    const deleteUnit = (id: string) => {
        save(units.filter(u => u.id !== id));
    };

    return {
        units,
        addUnit,
        updateUnit,
        deleteUnit
    };
};
