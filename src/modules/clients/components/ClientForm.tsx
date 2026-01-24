import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Building, MapPin, Mail, Phone, User, FileText } from 'lucide-react';
import { LOCATIONS_SV } from '../../../shared/data/locations_sv';

interface ClientFormProps {
    initialData?: Client;
    onSubmit: (data: Omit<Client, 'id'>) => void;
    onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Client, 'id'>>({
        fullName: '',
        documentType: 'DUI',
        documentNumber: '',
        ncr: '',
        commercialActivity: '',
        phone: '',
        email: '',
        country: 'El Salvador',
        department: '',
        district: '',
        municipality: '',
        address: '',
        isLargeTaxpayer: false
    });

    useEffect(() => {
        if (initialData) {
            const { id, ...data } = initialData;
            setFormData(data);
        }
    }, [initialData]);

    const formatDui = (value: string) => {
        // 00000000-0
        const digits = value.replace(/\D/g, '').slice(0, 9);
        if (digits.length > 8) {
            return `${digits.slice(0, 8)}-${digits.slice(8)}`;
        }
        return digits;
    };

    const formatNit = (value: string) => {
        // 0571-060698-102-7
        const digits = value.replace(/\D/g, '').slice(0, 14);
        let formatted = digits;
        if (digits.length > 3) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
        if (digits.length > 9) formatted = `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10)}`;
        if (digits.length > 12) formatted = `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 13)}-${digits.slice(13)}`;
        return formatted;
    };

    const handleDocumentChange = (value: string) => {
        let formatted = value;
        if (formData.documentType === 'DUI') formatted = formatDui(value);
        if (formData.documentType === 'NIT') formatted = formatNit(value);
        setFormData(prev => ({ ...prev, documentNumber: formatted }));
    };

    const handleNcrChange = (value: string) => {
        // Numbers and hyphens
        const val = value.replace(/[^\d-]/g, '');
        setFormData(prev => ({ ...prev, ncr: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Derived lists based on selection
    const departments = LOCATIONS_SV.departamentos;
    const selectedDepartment = departments.find(d => d.nombre === formData.department);
    const municipalities = selectedDepartment ? selectedDepartment.municipios : [];
    const selectedMunicipality = municipalities.find(m => m.nombre === formData.municipality);
    const districts = selectedMunicipality ? selectedMunicipality.distritos : [];

    // NOTE: Hierarchy in new law is Dept -> Municipality -> District.
    // User interface requested: Dept -> District -> Municipality.
    // But data flows Dept -> Muni -> Dist.
    // If I select a Municipality, I get Districts.
    // If user wants generic "Distrito" drop down BEFORE Municipality, I would have to flatten ALL districts in the department?
    // Let's implement logical flow: Dept -> Municipality -> District.

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>

            {/* Personal / Legal Info */}
            <div className="grid gap-4 p-4 border rounded-md bg-muted/10">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-2">Información General</h3>
                <Input
                    label="Nombre Completo o Razón Social *"
                    placeholder="Ej. Juan Pérez o Empresa S.A. de C.V."
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    icon={<User size={18} />}
                    autoFocus
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="input-wrapper">
                        <label className="input-label">Tipo Documento</label>
                        <select
                            className="input-field"
                            style={{ height: '40px', padding: '0 0.75rem' }}
                            value={formData.documentType}
                            onChange={e => setFormData({ ...formData, documentType: e.target.value as any, documentNumber: '' })}
                        >
                            <option value="DUI">DUI</option>
                            <option value="NIT">NIT</option>
                            <option value="Pasaporte">Pasaporte</option>
                        </select>
                    </div>
                    <Input
                        label={`Número de ${formData.documentType} *`}
                        placeholder={formData.documentType === 'DUI' ? '00000000-0' : formData.documentType === 'NIT' ? '0000-000000-000-0' : 'Pasaporte'}
                        value={formData.documentNumber}
                        onChange={e => handleDocumentChange(e.target.value)}
                        required
                        icon={<FileText size={18} />}
                        maxLength={formData.documentType === 'DUI' ? 10 : formData.documentType === 'NIT' ? 17 : 20}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="NCR (Numérico)"
                        placeholder="Solo números"
                        value={formData.ncr}
                        onChange={e => handleNcrChange(e.target.value)}
                    />
                    <div className="input-wrapper" style={{ justifyContent: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isLargeTaxpayer}
                                onChange={e => setFormData({ ...formData, isLargeTaxpayer: e.target.checked })}
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span className="text-sm font-medium">Retención IVA (Gran Contribuyente)</span>
                        </label>
                    </div>
                </div>

                <Input
                    label="Actividad Comercial"
                    placeholder="Ej. Venta de repuestos, Servicios profesionales..."
                    value={formData.commercialActivity}
                    onChange={e => setFormData({ ...formData, commercialActivity: e.target.value })}
                    icon={<Building size={18} />}
                />
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 p-4 border rounded-md bg-muted/10">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-2">Contacto</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Teléfono"
                        placeholder="2222-2222"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        icon={<Phone size={18} />}
                    />
                    <Input
                        label="Correo Electrónico"
                        placeholder="cliente@email.com"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        icon={<Mail size={18} />}
                    />
                </div>
            </div>

            {/* Address Info */}
            <div className="grid gap-4 p-4 border rounded-md bg-muted/10">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-2">Dirección</h3>

                <div className="input-wrapper">
                    <label className="input-label">País</label>
                    <div className="input-container">
                        <input className="input-field bg-muted text-muted-foreground" value="El Salvador" disabled readOnly />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-wrapper">
                        <label className="input-label">Departamento</label>
                        <select
                            className="input-field"
                            style={{ height: '40px' }}
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value, municipality: '', district: '' })}
                        >
                            <option value="">Seleccionar...</option>
                            {departments.map(d => <option key={d.idMDepa} value={d.nombre}>{d.nombre}</option>)}
                        </select>
                    </div>
                    <div className="input-wrapper">
                        <label className="input-label">Municipio</label>
                        <select
                            className="input-field"
                            style={{ height: '40px' }}
                            value={formData.municipality}
                            onChange={e => setFormData({ ...formData, municipality: e.target.value, district: '' })}
                            disabled={!formData.department}
                        >
                            <option value="">Seleccionar...</option>
                            {municipalities.map(m => (
                                <option key={m.nombre} value={m.nombre}>{m.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="input-wrapper">
                    <label className="input-label">Distrito</label>
                    <select
                        className="input-field"
                        style={{ height: '40px' }}
                        value={formData.district}
                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                        disabled={!formData.municipality}
                    >
                        <option value="">Seleccionar...</option>
                        {districts.map(d => (
                            <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Dirección de Domicilio"
                    placeholder="Colonia, Calle, # de Casa..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    icon={<MapPin size={18} />}
                />
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t sticky bottom-0 bg-surface">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Registrar Cliente'}
                </Button>
            </div>
        </form>
    );
};
