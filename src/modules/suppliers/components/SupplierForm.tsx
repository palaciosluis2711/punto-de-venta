import React, { useState, useEffect } from 'react';
import type { Supplier } from '../types';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Image, Building, Mail, Phone, MapPin, Trash } from 'lucide-react';

interface SupplierFormProps {
    initialData?: Supplier;
    onSubmit: (data: Omit<Supplier, 'id'>) => void;
    onCancel: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
        name: '',
        image: '',
        address: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                image: initialData.image || '',
                address: initialData.address || '',
                email: initialData.email || '',
                phone: initialData.phone || ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
                label="Nombre o Razón Social *"
                placeholder="Ej. Distribuidora Papelera"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                icon={<Building size={18} />}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                    label="URL del Logo"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    icon={<Image size={18} />}
                />
                <div className="input-wrapper">
                    <label className="input-label">O subir imagen local</label>
                    <div className="input-container">
                        <input
                            type="file"
                            accept="image/*"
                            className="input-field"
                            style={{ padding: '0.4rem' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setFormData(prev => ({ ...prev, image: reader.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {formData.image && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
                    <img src={formData.image} alt="Preview" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        icon={<Trash size={16} />}
                    >
                        Quitar imagen actual
                    </Button>
                </div>
            )}

            <Input
                label="Dirección"
                placeholder="Calle, Número, Ciudad"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                icon={<MapPin size={18} />}
            />

            <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                    label="Correo Electrónico"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    icon={<Mail size={18} />}
                />

                <Input
                    label="Teléfono"
                    type="tel"
                    placeholder="55 1234 5678"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    icon={<Phone size={18} />}
                />
            </div>

            <div className="flex justify-end gap-2 mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </Button>
            </div>
        </form>
    );
};
