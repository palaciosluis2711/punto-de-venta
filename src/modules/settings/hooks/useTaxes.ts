import { useState, useEffect } from 'react';

export interface Tax {
    id: string;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
}

const STORAGE_KEY = 'stationery_tax_settings';

export const useTaxes = () => {
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.taxes && Array.isArray(parsed.taxes)) {
                    setTaxes(parsed.taxes);
                }
            } catch (e) {
                console.error('Failed to parse tax settings', e);
            }
        }
        setLoading(false);
    }, []);

    const addTax = (tax: Omit<Tax, 'id'>) => {
        const newTax: Tax = {
            ...tax,
            id: Date.now().toString()
        };
        const updatedTaxes = [...taxes, newTax];
        setTaxes(updatedTaxes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ taxes: updatedTaxes }));
    };

    const removeTax = (id: string) => {
        const updatedTaxes = taxes.filter(t => t.id !== id);
        setTaxes(updatedTaxes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ taxes: updatedTaxes }));
    };

    return {
        taxes,
        loading,
        addTax,
        removeTax
    };
};
