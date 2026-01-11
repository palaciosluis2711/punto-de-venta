export interface Product {
    id: string;
    name: string;
    barcode: string;
    price: number;
    cost: number;
    stock: number;
    category: string;
    brand?: string;
    unit?: string;
    items_per_unit?: number;
    image?: string;
    minStock?: number;
    inventory?: Record<string, number>; // storeId -> quantity
    tax_apply?: boolean;
    tax_method?: 'inclusive' | 'exclusive';
    tax_rate?: number; // Optional, default 0.16 (16%) for now if applied
    associatedProducts?: {
        productId: string;
        quantity: number;
        bundlePrice?: number;
    }[];
}
