import { useState, useEffect } from 'react';

export interface TicketSettings {
    storeName: string;
    address: string;
    phone: string;
    rfc: string;
    website: string;
    footerMessage: string;
    logoUrl?: string; // Data URL or Image URL
    showLogo: boolean;
    showClient: boolean;
    showAddress: boolean;
    printerWidth: '80mm' | '57mm';
}

const DEFAULT_SETTINGS: TicketSettings = {
    storeName: 'Mi Tienda',
    address: 'Dirección de la tienda',
    phone: '',
    rfc: '',
    website: '',
    footerMessage: '¡Gracias por su compra!',
    showLogo: true,
    showClient: true,
    showAddress: true,
    printerWidth: '80mm'
};

const STORAGE_KEY = 'pos_ticket_settings';

export const useTicketSettings = () => {
    const [settings, setSettings] = useState<TicketSettings>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (updates: Partial<TicketSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    return {
        settings,
        updateSettings
    };
};
