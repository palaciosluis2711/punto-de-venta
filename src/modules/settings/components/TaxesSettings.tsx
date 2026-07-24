import React, { useState } from 'react';
import { useTaxes } from '../hooks/useTaxes';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Percent, Plus, Trash2, DollarSign } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import { CustomSelect } from '../../../shared/components/CustomSelect';

export const TaxesSettings: React.FC = () => {
    const { taxes, addTax, removeTax } = useTaxes();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaxName, setNewTaxName] = useState('');
    const [newTaxDesc, setNewTaxDesc] = useState('');
    const [newTaxType, setNewTaxType] = useState<'percentage' | 'fixed'>('percentage');
    const [newTaxValue, setNewTaxValue] = useState('');

    const handleAddTax = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(newTaxValue);
        if (!newTaxName.trim() || isNaN(val) || val < 0) return;

        addTax({
            name: newTaxName.trim(),
            description: newTaxDesc.trim() || undefined,
            type: newTaxType,
            value: val
        });

        setIsModalOpen(false);
        setNewTaxName('');
        setNewTaxDesc('');
        setNewTaxType('percentage');
        setNewTaxValue('');
    };

    return (
        <div className="settings-container animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <Percent size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Impuestos</h2>
                            <p className="header-subtitle">Configura los impuestos aplicables a tus productos.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-content-wrapper">
                <div className="settings-main-panel" style={{ maxWidth: '800px' }}>
                    
                    {/* Impuestos Personalizados */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Impuestos Personalizados</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Crea impuestos adicionales (porcentuales o de monto fijo) para aplicar a productos específicos.</p>
                            </div>
                            <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
                                Añadir Nuevo
                            </Button>
                        </div>

                        {taxes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                                <Percent size={32} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                                <h4 style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No hay impuestos personalizados</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Haz clic en "Añadir Nuevo" para crear tu primer impuesto personalizado.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                {taxes.map((tax) => (
                                    <div key={tax.id} style={{ 
                                        padding: '1.25rem', 
                                        border: '1px solid var(--border)', 
                                        borderRadius: 'var(--radius-md)', 
                                        backgroundColor: 'var(--surface)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{tax.name}</h4>
                                                {tax.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{tax.description}</p>}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeTax(tax.id)} style={{ color: 'var(--destructive)', padding: '0.25rem', height: 'auto' }}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem', 
                                            padding: '0.375rem 0.75rem', 
                                            backgroundColor: 'var(--surface-hover)', 
                                            borderRadius: 'var(--radius-full)',
                                            width: 'fit-content',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'var(--text-main)'
                                        }}>
                                            {tax.type === 'percentage' ? <Percent size={14} style={{ color: 'var(--primary)' }} /> : <DollarSign size={14} style={{ color: 'var(--success)' }} />}
                                            {tax.type === 'percentage' ? `${tax.value}%` : `$${tax.value.toFixed(2)}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nuevo Impuesto Personalizado"
            >
                <form onSubmit={handleAddTax} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Input
                        label="Nombre del Impuesto"
                        placeholder="Ej: Impuesto a bebidas azucaradas"
                        value={newTaxName}
                        onChange={(e: any) => setNewTaxName(e.target.value)}
                        required
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Descripción (Opcional)</label>
                        <textarea
                            className="input-field"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            placeholder="Detalles sobre cuándo aplica..."
                            value={newTaxDesc}
                            onChange={(e: any) => setNewTaxDesc(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Tipo de Valor</label>
                            <CustomSelect 
                                className="input-field"
                                value={newTaxType}
                                onChange={(e: any) => setNewTaxType(e.target.value as 'percentage' | 'fixed')}
                            >
                                <option value="percentage">Porcentaje (%)</option>
                                <option value="fixed">Monto Fijo ($)</option>
                            </CustomSelect>
                        </div>
                        
                        <Input
                            label="Valor"
                            type="number"
                            step={newTaxType === 'percentage' ? '0.1' : '0.01'}
                            min="0"
                            placeholder={newTaxType === 'percentage' ? '10' : '1.50'}
                            value={newTaxValue}
                            onChange={(e: any) => setNewTaxValue(e.target.value)}
                            required
                            icon={newTaxType === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Crear Impuesto
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
