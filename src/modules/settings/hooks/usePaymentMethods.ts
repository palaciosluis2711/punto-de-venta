import { useState, useEffect } from 'react';

export interface PaymentMethod {
    id: string;
    name: string;
    isDefault?: boolean;
}

const DEFAULT_METHODS: PaymentMethod[] = [
    { id: 'cash', name: 'Efectivo', isDefault: true },
    { id: 'card', name: 'Tarjeta de Crédito/Débito' },
    { id: 'transfer', name: 'Transferencia' }
];

const STORAGE_KEY = 'app_settings_payment_methods';

export const usePaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_METHODS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentMethods));
    }, [paymentMethods]);

    const addMethod = (name: string) => {
        const newMethod: PaymentMethod = {
            id: Date.now().toString(),
            name
        };
        setPaymentMethods(prev => [...prev, newMethod]);
    };

    const updateMethod = (id: string, name: string) => {
        setPaymentMethods(prev => prev.map(m =>
            m.id === id ? { ...m, name } : m
        ));
    };

    const deleteMethod = (id: string) => {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
    };

    return {
        paymentMethods,
        addMethod,
        updateMethod,
        deleteMethod
    };
};
