import { useState, useEffect, useCallback } from 'react';
import type { PriceRule } from '../types';

const STORAGE_KEY = 'app_price_rules';

export const useRules = () => {
    const [rules, setRules] = useState<PriceRule[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    }, [rules]);

    const addRule = useCallback((data: Omit<PriceRule, 'id' | 'createdAt'>) => {
        const newRule: PriceRule = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: Date.now()
        };
        setRules(prev => [...prev, newRule]);
    }, []);

    const updateRule = useCallback((id: string, updates: Partial<PriceRule>) => {
        setRules(prev => prev.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
    }, []);

    const deleteRule = useCallback((id: string) => {
        setRules(prev => prev.filter(rule => rule.id !== id));
    }, []);

    const getRule = useCallback((id: string) => {
        return rules.find(rule => rule.id === id);
    }, [rules]);

    return {
        rules,
        addRule,
        updateRule,
        deleteRule,
        getRule
    };
};
