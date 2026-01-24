export interface PriceRule {
    id: string;
    name: string;
    formula: string; // e.g., "cost / 0.8" or "price * 0.9"
    targetCategories: string[]; // empty array means all categories
    applyToBundles: boolean;
    allowWithDiscount: boolean;
    createdAt: number;
}
