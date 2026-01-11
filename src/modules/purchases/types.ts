export interface PurchaseItem {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
}

export interface Purchase {
    id: string;
    date: string;
    storeId: string;
    storeName: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseItem[];
    total: number;
    status: 'completed' | 'cancelled';
    notes?: string;
    createdAt: number;
}
