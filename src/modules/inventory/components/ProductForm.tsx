import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useCategories } from '../../settings/hooks/useCategories';
import { useBrands } from '../../settings/hooks/useBrands';
import { useUnits } from '../../settings/hooks/useUnits';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface ProductFormProps {
    initialData?: Product;
    onSubmit: (data: Omit<Product, 'id'>) => void;
    onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const { categories } = useCategories();
    const { brands } = useBrands();
    const { units } = useUnits();
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        barcode: '',
        price: 0,
        cost: 0,
        stock: 0,
        category: '',
        brand: '',
        unit: '',
        items_per_unit: 0,
        image: ''
    });

    useEffect(() => {
        if (initialData) {
            const { id, ...rest } = initialData;
            setFormData(rest);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Image Upload Section */}
            <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium text-muted">Imagen del Producto (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {formData.image ? (
                            <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <ImageIcon className="text-muted" size={32} />
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                            <Button type="button" variant="outline" icon={<Upload size={16} />}>
                                Subir Imagen
                            </Button>
                        </div>
                        {formData.image && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-danger"
                                onClick={handleRemoveImage}
                                icon={<X size={16} />}
                            >
                                Quitar Imagen
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="input-wrapper">
                <Input
                    label="Nombre del Producto"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Cuaderno Profesional"
                    required
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-wrapper">
                    <Input
                        label="Código de Barras"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        placeholder="Escanea o escribe..."
                        required
                    />
                </div>
                <div className="input-wrapper">
                    <label className="input-label">Categoría</label>
                    <div className="input-container">
                        <select
                            name="category"
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="input-field"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <Input
                    type="number"
                    label="Precio Venta"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                />
                <Input
                    type="number"
                    label="Costo"
                    name="cost"
                    value={formData.cost || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                />
                <Input
                    type="number"
                    label="Stock Inicial"
                    name="stock"
                    value={formData.stock || ''}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    required
                />
            </div>

            <div className="input-wrapper">
                <label className="input-label">Marca (Opcional)</label>
                <div className="input-container">
                    <select
                        name="brand"
                        value={formData.brand || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        className="input-field"
                    >
                        <option value="">Seleccionar...</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>{brand.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: formData.unit && units.find(u => u.name === formData.unit)?.is_composite ? '1fr 1fr' : '1fr', gap: '1rem', transition: 'all 0.3s ease' }}>
                <div className="input-wrapper">
                    <label className="input-label">Unidad de Medida (Opcional)</label>
                    <div className="input-container">
                        <select
                            name="unit"
                            value={formData.unit || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                            className="input-field"
                        >
                            <option value="">Seleccionar...</option>
                            {units.map(unit => (
                                <option key={unit.id} value={unit.name}>{unit.name} ({unit.abbreviation})</option>
                            ))}
                        </select>
                    </div>
                </div>
                {formData.unit && units.find(u => u.name === formData.unit)?.is_composite && (
                    <div className="animate-in fade-in slide-in-from-left-4">
                        <Input
                            type="number"
                            label={`Unidades por ${formData.unit}`}
                            value={formData.items_per_unit || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, items_per_unit: parseFloat(e.target.value) || 0 }))}
                            placeholder="Cantidad..."
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Agregar Producto'}
                </Button>
            </div>
        </form>
    );
};
