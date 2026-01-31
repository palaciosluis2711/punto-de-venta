export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isSpecialPrice?: boolean;
}

export interface Sale {
    id: string;
    date: string; // ISO string
    total: number;
    items: SaleItem[];
    paymentMethod: string;
    clientName: string;
    storeId: string;
    storeName: string;
    notes?: {
        sale?: string;
        payment?: string;
        staff?: string;
    };
    discount?: number; // Value in $
    shipping?: number;
    receivedAmount: number;
    change: number;
    status: 'completed' | 'cancelled'; // Future proofing
}
