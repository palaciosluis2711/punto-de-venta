export interface Supplier {
    id: string;
    name: string; // Razón Social (Obligatorio)
    image?: string; // URL or base64
    address?: string;
    email?: string;
    phone?: string;
}
