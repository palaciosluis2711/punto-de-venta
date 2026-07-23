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
    taxes?: string[]; // Array of custom tax IDs applied to this product
    associatedProducts?: {
        productId: string;
        quantity: number;
        bundlePrice?: number;
    }[];
}
