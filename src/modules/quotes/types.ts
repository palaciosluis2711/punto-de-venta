export interface QuoteItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number; // Added to support POS-style discount calculations
    subtotal: number;
    isSpecialPrice?: boolean;
    discount?: { type: 'percent' | 'amount'; value: number }; // Added to store discount details
    manualPrice?: number; // Added to support manual/rule prices
    unitCost?: number;
    category?: string; // Added to support category rules
}

export interface Quote {
    id: string;
    date: string;
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    storeId: string;
    storeName: string;
    items: QuoteItem[];
    subtotal: number;
    total: number;
    discount?: number;
    notes?: string;
    status: 'draft' | 'sent';
}
