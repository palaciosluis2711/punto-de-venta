import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stationery_tax_settings';

export const useTaxes = () => {
    const [taxRate, setTaxRate] = useState<number>(0.16);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (typeof parsed.taxRate === 'number') {
                    setTaxRate(parsed.taxRate);
                }
            } catch (e) {
                console.error('Failed to parse tax settings', e);
            }
        }
        setLoading(false);
    }, []);

    const updateTaxRate = (rate: number) => {
        setTaxRate(rate);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ taxRate: rate }));
    };

    return {
        taxRate,
        loading,
        updateTaxRate
    };
};
