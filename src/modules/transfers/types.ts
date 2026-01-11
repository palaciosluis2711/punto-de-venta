export interface TransferItem {
    productId: string;
    productName: string;
    quantity: number;
    // We might track cost for value transfer purposes, though it doesn't change
    unitCost: number;
    subtotal: number; // Quantity * UnitCost
}

export interface Transfer {
    id: string;
    date: string;
    sourceStoreId: string;
    sourceStoreName: string;
    destinationStoreId: string;
    destinationStoreName: string;
    items: TransferItem[];
    totalValue: number; // Total value of transferred goods
    status: 'completed' | 'cancelled';
    notes?: string;
    createdAt: number;
}
