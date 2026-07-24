import { useState, useEffect } from 'react';
import type { Quote } from '../types';

const STORAGE_KEY = 'app_quotes';

export const useQuotes = () => {
    const [quotes, setQuotes] = useState<Quote[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    }, [quotes]);

    const addQuote = (quote: Quote) => {
        setQuotes(prev => [quote, ...prev]);
    };

    const updateQuote = (id: string, updatedQuote: Partial<Quote>) => {
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updatedQuote } : q));
    };

    const deleteQuote = (id: string) => {
        setQuotes(prev => prev.filter(q => q.id !== id));
    };

    return {
        quotes,
        addQuote,
        updateQuote,
        deleteQuote
    };
};
