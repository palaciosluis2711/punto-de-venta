import { useState, useEffect, useCallback } from 'react';
import type { Client } from '../types';

const STORAGE_KEY = 'app_clients_data';

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    }, [clients]);

    const addClient = useCallback((data: Omit<Client, 'id'>) => {
        const newClient: Client = {
            ...data,
            id: crypto.randomUUID()
        };
        setClients(prev => [...prev, newClient]);
    }, []);

    const updateClient = useCallback((id: string, data: Partial<Client>) => {
        setClients(prev => prev.map(client =>
            client.id === id ? { ...client, ...data } : client
        ));
    }, []);

    const deleteClient = useCallback((id: string) => {
        setClients(prev => prev.filter(client => client.id !== id));
    }, []);

    const deleteClients = useCallback((ids: string[]) => {
        setClients(prev => prev.filter(client => !ids.includes(client.id)));
    }, []);

    const searchClients = useCallback((query: string) => {
        const lower = query.toLowerCase();
        return clients.filter(client =>
            client.fullName.toLowerCase().includes(lower) ||
            client.documentNumber.includes(lower) ||
            client.email?.toLowerCase().includes(lower)
        );
    }, [clients]);

    return {
        clients,
        addClient,
        updateClient,
        deleteClient,
        deleteClients,
        searchClients
    };
};
