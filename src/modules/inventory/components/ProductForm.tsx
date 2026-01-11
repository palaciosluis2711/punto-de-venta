import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useCategories } from '../../settings/hooks/useCategories';
import { useBrands } from '../../settings/hooks/useBrands';
import { useUnits } from '../../settings/hooks/useUnits';
import { useTaxes } from '../../settings/hooks/useTaxes';
import { useInventory } from '../hooks/useInventory'; // For looking up associated product names
import { Image as ImageIcon, Upload, X, Plus, Trash2, RefreshCw } from 'lucide-react';
import { ProductSelectionModal } from './ProductSelectionModal';

interface ProductFormProps {
    initialData?: Product;
    onSubmit: (data: Omit<Product, 'id'>) => void;
    onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
    // ... existing hooks ...
    const { categories } = useCategories();
    const { brands } = useBrands();
    const { units } = useUnits();
    const { taxRate } = useTaxes();
    // Use Inventory to get list of products for associated lookups
    const { products: allProducts } = useInventory();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Special Product Toggle State
    const [isSpecial, setIsSpecial] = useState(false);

    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        barcode: '',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 0,
        category: '',
        brand: '',
        unit: '',
        image: '',
        associatedProducts: []
    });

    const handleGenerateBarcode = () => {
        // Generate a random 12-digit barcode
        const randomBarcode = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        setFormData(prev => ({ ...prev, barcode: randomBarcode }));
    };

    // Helper to calculate cost for composite products
    const calculateCompositeCost = (associated: { productId: string; quantity: number }[]) => {
        let totalCost = 0;
        associated.forEach(item => {
            const prod = allProducts.find(p => p.id === item.productId);
            if (prod) {
                totalCost += (prod.cost || 0) * item.quantity;
            }
        });
        return Number(totalCost.toFixed(2));
    };

    // Helper to calculate total bundle price
    const calculateBundlePrice = (associated: { productId: string; quantity: number; bundlePrice: number }[]) => {
        const total = associated.reduce((sum, item) => sum + (item.bundlePrice || 0), 0);
        return Number(total.toFixed(2));
    };

    const handleAddAssociated = (product: Product, quantity: number, price: number) => {
        setFormData(prev => {
            const current = (prev.associatedProducts || []) as { productId: string; quantity: number; bundlePrice: number }[];
            let updated = [...current];
            const exists = current.findIndex(p => p.productId === product.id);

            if (exists >= 0) {
                updated[exists] = { productId: product.id, quantity, bundlePrice: price };
            } else {
                updated = [...current, { productId: product.id, quantity, bundlePrice: price }];
            }

            // Recalculate cost and price if special
            const newCost = isSpecial ? calculateCompositeCost(updated) : prev.cost;
            const newPrice = isSpecial ? calculateBundlePrice(updated) : prev.price;

            return {
                ...prev,
                associatedProducts: updated,
                cost: newCost,
                price: newPrice
            };
        });
    };

    const handleRemoveAssociated = (index: number) => {
        setFormData(prev => {
            const updated = (prev.associatedProducts || []) as { productId: string; quantity: number; bundlePrice: number }[];
            updated.splice(index, 1);

            // Recalculate cost and price if special
            const newCost = isSpecial ? calculateCompositeCost(updated) : prev.cost;
            const newPrice = isSpecial ? calculateBundlePrice(updated) : prev.price;

            return {
                ...prev,
                associatedProducts: updated,
                cost: newCost,
                price: newPrice
            };
        });
    };

    useEffect(() => {
        if (initialData) {
            const { id, ...rest } = initialData;
            // Ensure associatedProducts has bundlePrice if missing (migration)
            const sanitizedData = {
                ...rest,
                associatedProducts: rest.associatedProducts?.map(ap => ({
                    ...ap,
                    bundlePrice: ap.bundlePrice ?? 0 // Default to 0 if not present
                }))
            };
            setFormData(sanitizedData);

            if (rest.associatedProducts && rest.associatedProducts.length > 0) {
                setIsSpecial(true);
            }
        } else {
            // Reset form for "New Product"
            setFormData({
                name: '',
                barcode: '',
                price: 0,
                cost: 0,
                stock: 0,
                minStock: 0,
                category: '',
                brand: '',
                unit: '',
                image: '',
                associatedProducts: []
            });
            setIsSpecial(false);
            setErrors({});
        }
    }, [initialData]);

    // Validation State
    const [errors, setErrors] = useState<{ name?: string; barcode?: string }>({});

    // Validate unique fields
    const validate = (data: Product | Omit<Product, 'id'>) => {
        const newErrors: { name?: string; barcode?: string } = {};
        const currentId = initialData?.id;

        // Check for duplicate barcode
        if (data.barcode) {
            const barcodeExists = allProducts.some(p =>
                p.barcode === data.barcode && p.id !== currentId
            );
            if (barcodeExists) {
                newErrors.barcode = "Este código de barras ya está registrado en otro producto.";
            }
        }

        // Check for duplicate name (case insensitive)
        if (data.name) {
            const nameExists = allProducts.some(p =>
                p.name.toLowerCase() === data.name.trim().toLowerCase() && p.id !== currentId
            );
            if (nameExists) {
                newErrors.name = "Ya existe un producto con este nombre.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time validation
        if (name === 'name' || name === 'barcode') {
            const currentId = initialData?.id;
            let errorMsg = undefined;

            if (name === 'barcode' && value) {
                const exists = allProducts.some(p =>
                    p.barcode === value && p.id !== currentId
                );
                if (exists) {
                    errorMsg = "Este código de barras ya está registrado.";
                }
            }

            if (name === 'name' && value) {
                const exists = allProducts.some(p =>
                    p.name.toLowerCase() === value.trim().toLowerCase() && p.id !== currentId
                );
                if (exists) {
                    errorMsg = "Ya existe un producto con este nombre.";
                }
            }

            setErrors(prev => ({ ...prev, [name]: errorMsg }));
        }
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

        // Final Validation before submit
        if (!validate(formData)) {
            return;
        }

        // Convert strings to numbers for submission
        const submissionData = {
            ...formData,
            price: Number(formData.price),
            cost: Number(formData.cost),
            stock: Number(formData.stock),
            minStock: Number(formData.minStock || 0)
        };
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Image Upload Section */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-2">
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

                {/* Special Product Toggle */}
                <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-surface-hover">
                    <input
                        type="checkbox"
                        id="isSpecial"
                        checked={isSpecial}
                        onChange={(e) => {
                            setIsSpecial(e.target.checked);
                            // Reset associated products if turning off
                            if (!e.target.checked) {
                                setFormData(prev => ({ ...prev, associatedProducts: [] }));
                            } else {
                                // If turning on, reset unit if it's not a container?
                                // Actually, let's just let the user pick
                            }
                        }}
                        className="w-4 h-4 accent-primary"
                    />
                    <label htmlFor="isSpecial" className="text-sm font-medium cursor-pointer">
                        Producto Especial
                    </label>
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
                    error={errors.name}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-wrapper">
                    <div className="flex justify-between items-end mb-2">
                        <label className="input-label">Código de Barras</label>
                        <button
                            type="button"
                            onClick={handleGenerateBarcode}
                            className="p-1 rounded-md text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            title="Generar código aleatorio"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                    <Input
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        placeholder="Escanea o escribe..."
                        required
                        error={errors.barcode}
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

            <div style={{ display: 'grid', gridTemplateColumns: isSpecial ? '1fr' : '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="input-wrapper">
                    <Input
                        type="number"
                        label="Precio Venta"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        disabled={isSpecial}
                        className={`no-spinners ${isSpecial ? 'bg-muted cursor-not-allowed opacity-70' : ''}`}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                            if (!/[\d\b\t.]/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Tab', 'Home', 'End'].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                    />
                    {isSpecial && <span className="text-xs text-muted mt-1 block">Calculado automáticamente (suma de asociados)</span>}
                </div>
                {!isSpecial && (
                    <>
                        <Input
                            type="number"
                            label="Costo"
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            className="no-spinners"
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => {
                                if (!/[\d\b\t.]/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Tab', 'Home', 'End'].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                        <Input
                            type="number"
                            label="Cantidad Alerta"
                            name="minStock"
                            value={formData.minStock === 0 ? '' : formData.minStock} // Show empty if 0
                            onChange={(e) => {
                                // Handle empty value by setting to 0, logic in value prop handles display
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    minStock: isNaN(val) ? 0 : val
                                }));
                            }}
                            placeholder="0"
                            min="0"
                            className="no-spinners"
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => {
                                if (!/[\d\b\t.]/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Tab', 'Home', 'End'].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </>
                )}
            </div>

            {/* Tax Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-wrapper">
                    <label className="input-label">Impuestos (IVA)</label>
                    <div className="input-container">
                        <select
                            name="tax_apply"
                            value={formData.tax_apply ? 'true' : 'false'}
                            onChange={(e) => {
                                const applies = e.target.value === 'true';
                                setFormData(prev => ({
                                    ...prev,
                                    tax_apply: applies,
                                    // Default to inclusive if turning on, or reset if turning off
                                    tax_method: applies ? (prev.tax_method || 'inclusive') : undefined
                                }));
                            }}
                            className="input-field"
                        >
                            <option value="false">No Aplica / Exento</option>
                            <option value="true">Sí, Aplica IVA ({taxRate * 100}%)</option>
                        </select>
                    </div>
                </div>

                {formData.tax_apply && (
                    <div className="input-wrapper animate-in fade-in zoom-in-95">
                        <label className="input-label">Cálculo de Impuesto</label>
                        <div className="input-container">
                            <select
                                name="tax_method"
                                value={formData.tax_method || 'inclusive'}
                                onChange={(e) => setFormData(prev => ({ ...prev, tax_method: e.target.value as 'inclusive' | 'exclusive' }))}
                                className="input-field"
                            >
                                <option value="inclusive">Inclusivo (Precio incluye IVA)</option>
                                <option value="exclusive">Exclusivo (IVA se suma al precio)</option>
                            </select>
                        </div>
                    </div>
                )}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem', transition: 'all 0.3s ease' }}>
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
                            {units
                                .filter(u => isSpecial ? u.is_composite : !u.is_composite)
                                .map(unit => (
                                    <option key={unit.id} value={unit.name}>{unit.name} ({unit.abbreviation})</option>
                                ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Associated Products Section (Only if isSpecial is Active) */}
            {isSpecial && (
                <div className="animate-in fade-in slide-in-from-top-4 mt-2 p-4 pt-3 border border-border rounded-lg bg-surface-hover mb-2">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h4 className="font-semibold text-sm">Productos Asociados</h4>
                            <p className="text-xs text-muted">Añade productos que componen este paquete. El costo se calculará automáticamente.</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(true)} icon={<Plus size={14} />}>
                            Asociar Producto
                        </Button>
                    </div>

                    {formData.associatedProducts && formData.associatedProducts.length > 0 ? (
                        <div className="border border-border rounded-md overflow-hidden bg-surface">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/20 text-xs text-muted uppercase">
                                    <tr>
                                        <th className="p-2 text-left font-medium">Producto</th>
                                        <th className="p-2 text-center font-medium w-32">Cant.</th>
                                        <th className="p-2 text-right font-medium w-24">Precio Total</th>
                                        <th className="p-2 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {formData.associatedProducts.map((p, idx) => {
                                        // Try to find product name in full list if possible, or store it?
                                        // Ideally we should store name in associatedProducts for display, or look it up here.
                                        // For now, I'll need to fetch the product list here to display names or assume names are stored?
                                        // Let's assume we ONLY stored ID and Qty as per type definition.
                                        // So we need access to `useInventory` here to show names!
                                        // I'll add useInventory hook call at top level.
                                        const productInfo = allProducts.find(prod => prod.id === p.productId);

                                        return (
                                            <tr key={idx}>
                                                <td className="p-2">
                                                    <div className="font-medium">{productInfo?.name || 'Producto Desconocido'}</div>
                                                    <div className="text-xs text-muted">{productInfo?.barcode}</div>
                                                </td>
                                                <td className="p-2 text-center">{p.quantity}</td>
                                                <td className="p-2 text-right font-medium text-success">
                                                    ${(p.bundlePrice || 0).toFixed(2)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveAssociated(idx)} className="text-danger hover:bg-danger/10 p-1 rounded">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-4 border border-dashed border-border rounded text-muted text-sm bg-surface/50">
                            No hay productos asociados. Haz clic en "Asociar Producto" para agregar.
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-2 mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Agregar Producto'}
                </Button>
            </div>

            <ProductSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleAddAssociated}
            />
        </form>
    );
};
