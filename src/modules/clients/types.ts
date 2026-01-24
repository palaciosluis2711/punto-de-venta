export interface Client {
    id: string;
    fullName: string;
    documentType: 'DUI' | 'NIT' | 'Pasaporte';
    documentNumber: string;
    ncr?: string;
    commercialActivity?: string;
    phone?: string;
    email?: string;
    country: 'El Salvador';
    department: string;
    district: string;
    municipality: string;
    address: string;
    isLargeTaxpayer: boolean;
}
