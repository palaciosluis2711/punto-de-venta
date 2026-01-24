import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useRules } from '../hooks/useRules';
import { useCategories } from '../hooks/useCategories';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import type { PriceRule } from '../types';

export const RulesSettings: React.FC = () => {
    const { rules, addRule, updateRule, deleteRule } = useRules();
    const { categories } = useCategories();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PriceRule | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [formulaTokens, setFormulaTokens] = useState<string[]>([]);
    const [currentNumber, setCurrentNumber] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [applyToBundles, setApplyToBundles] = useState(false);
    const [allowWithDiscount, setAllowWithDiscount] = useState(false);

    const handleAddClick = () => {
        setEditingRule(undefined);
        resetForm();
        setIsModalOpen(true);
    };

    const handleEditClick = (rule: PriceRule) => {
        setEditingRule(rule);
        setName(rule.name);
        setFormulaTokens(rule.formula.split(' ').filter(t => t.trim() !== ''));
        setSelectedCategories(rule.targetCategories);
        setApplyToBundles(rule.applyToBundles);
        setAllowWithDiscount(rule.allowWithDiscount);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setName('');
        setFormulaTokens([]);
        setCurrentNumber('');
        setSelectedCategories([]);
        setApplyToBundles(false);
        setAllowWithDiscount(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formula = formulaTokens.join(' ');

        if (!name.trim() || formulaTokens.length === 0) return;

        const ruleData = {
            name,
            formula,
            targetCategories: selectedCategories,
            applyToBundles,
            allowWithDiscount
        };

        if (editingRule) {
            updateRule(editingRule.id, ruleData);
        } else {
            addRule(ruleData);
        }
        setIsModalOpen(false);
    };

    // Formula Builder Helpers
    const addToken = (token: string) => {
        setFormulaTokens(prev => [...prev, token]);
    };

    const addNumberToken = () => {
        if (currentNumber && !isNaN(parseFloat(currentNumber))) {
            addToken(currentNumber);
            setCurrentNumber('');
        }
    };

    const removeLastToken = () => {
        setFormulaTokens(prev => prev.slice(0, -1));
    };

    // Category Helpers
    const toggleCategory = (catId: string) => {
        setSelectedCategories(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );
    };

    const toggleAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(categories.map(c => c.id));
        }
    };

    // Styles
    const sectionTitleStyle = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' };
    const chipBaseStyle = {
        padding: '0.25rem 0.75rem',
        borderRadius: '4px', // Standard rounded-md feel, not pills
        fontSize: '0.75rem',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        marginRight: '0.25rem',
        marginBottom: '0.25rem'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Reglas de Precio</h2>
                    <p className="text-muted">Crea reglas visuales para calcular precios automáticamente.</p>
                </div>
                <Button onClick={handleAddClick} icon={<Plus size={18} />}>
                    Nueva Regla
                </Button>
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {rules.map(rule => (
                    <div key={rule.id} style={{
                        padding: '1rem',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        // Flat design, no shadow
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{rule.name}</h3>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(rule)} style={{ width: '2rem', height: '2rem', padding: 0 }}>
                                    <Edit size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(rule.id)} style={{ width: '2rem', height: '2rem', padding: 0, color: 'var(--destructive)' }}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                                {rule.formula.split(' ').map((t, i) => (
                                    <span key={i} style={{
                                        ...chipBaseStyle,
                                        backgroundColor: t === 'cost' ? '#eff6ff' : (t === 'price' ? '#f0fdf4' : (['+', '-', '*', '/'].includes(t) ? '#f3f4f6' : '#fefce8')),
                                        color: t === 'cost' ? '#1d4ed8' : (t === 'price' ? '#15803d' : (['+', '-', '*', '/'].includes(t) ? '#374151' : '#a16207')),
                                        border: `1px solid ${t === 'cost' ? '#bfdbfe' : (t === 'price' ? '#bbf7d0' : (['+', '-', '*', '/'].includes(t) ? '#e5e7eb' : '#fef08a'))}`
                                    }}>
                                        {t === 'cost' ? 'Costo' : t === 'price' ? 'Precio' : t}
                                    </span>
                                ))}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                {rule.targetCategories.length === 0 ? 'Aplica a todas las categorías' : `Aplica a ${rule.targetCategories.length} categorías`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRule ? 'Editar Regla' : 'Nueva Regla'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Name */}
                    <div>
                        <Input
                            label="Nombre de la Regla"
                            placeholder="Ej: Precio Mayorista"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Formula Builder */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--background)' }}>
                        <label style={sectionTitleStyle}>Constructor de Fórmula</label>

                        {/* Display Area */}
                        <div style={{
                            minHeight: '3.5rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}>
                            {formulaTokens.length === 0 && <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontSize: '0.875rem' }}>Selecciona elementos abajo para construir la fórmula...</span>}
                            {formulaTokens.map((token, idx) => (
                                <span key={idx} style={{
                                    ...chipBaseStyle,
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: token === 'cost' ? 'var(--primary)' : (token === 'price' ? '#10b981' : (['+', '-', '*', '/'].includes(token) ? '#e5e7eb' : '#f59e0b')),
                                    color: ['+', '-', '*', '/'].includes(token) ? '#1f2937' : '#ffffff',
                                }}>
                                    {token === 'cost' ? 'Costo' : token === 'price' ? 'Precio' : token}
                                </span>
                            ))}
                        </div>

                        {/* Controls Container */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '1rem', alignItems: 'start' }}>
                            {/* Variables & Ops */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button type="button" size="sm" onClick={() => addToken('cost')} style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', borderColor: '#bee3f8', border: '1px solid', boxShadow: 'none' }}>
                                        Costo
                                    </Button>
                                    <Button type="button" size="sm" onClick={() => addToken('price')} style={{ backgroundColor: '#f0fff4', color: '#2f855a', borderColor: '#c6f6d5', border: '1px solid', boxShadow: 'none' }}>
                                        Precio
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f9fafb', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    {['+', '-', '*', '/'].map(op => (
                                        <button key={op} type="button" onClick={() => addToken(op)} style={{
                                            width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', border: '1px solid transparent', background: 'transparent', borderRadius: '4px', cursor: 'pointer',
                                            color: '#374151', transition: 'background-color 0.2s',
                                        }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            {op}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Number Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Valor (ej: 0.8)"
                                        style={{
                                            flex: 1,
                                            height: '2rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border)',
                                            padding: '0 0.5rem',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            boxShadow: 'none'
                                        }}
                                        value={currentNumber}
                                        onChange={e => setCurrentNumber(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addNumberToken();
                                            }
                                        }}
                                    />
                                    <Button type="button" size="sm" onClick={addNumberToken} disabled={!currentNumber} variant="outline" style={{ boxShadow: 'none' }}>
                                        Agregar
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="button" size="sm" variant="ghost" onClick={removeLastToken} disabled={formulaTokens.length === 0} style={{ color: 'var(--destructive)', height: '2rem', boxShadow: 'none' }}>
                                        <Trash2 size={14} style={{ marginRight: '0.25rem' }} /> Borrar Último
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label style={sectionTitleStyle}>Aplicar a Categorías</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={toggleAllCategories}
                                style={{
                                    ...chipBaseStyle,
                                    backgroundColor: selectedCategories.length === 0 || selectedCategories.length === categories.length
                                        ? 'var(--primary)' : 'var(--muted)',
                                    color: selectedCategories.length === 0 || selectedCategories.length === categories.length
                                        ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                                    border: '1px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Todas
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => toggleCategory(cat.id)}
                                    style={{
                                        ...chipBaseStyle,
                                        backgroundColor: selectedCategories.includes(cat.id)
                                            ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--surface)',
                                        color: selectedCategories.includes(cat.id)
                                            ? 'var(--primary)' : 'var(--foreground)',
                                        border: selectedCategories.includes(cat.id)
                                            ? '1px solid var(--primary)' : '1px solid var(--border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={applyToBundles}
                                onChange={e => setApplyToBundles(e.target.checked)}
                                style={{
                                    width: '1rem', height: '1rem', borderRadius: '0.25rem',
                                    borderColor: 'var(--border)', color: 'var(--primary)'
                                }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Aplicar también a Bundles (Paquetes)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={allowWithDiscount}
                                onChange={e => setAllowWithDiscount(e.target.checked)}
                                style={{
                                    width: '1rem', height: '1rem', borderRadius: '0.25rem',
                                    borderColor: 'var(--border)', color: 'var(--primary)'
                                }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Permitir aplicar sobre descuentos manuales</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!name || formulaTokens.length === 0}>
                            {editingRule ? 'Guardar Cambios' : 'Crear Regla'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) deleteRule(deleteId);
                    setDeleteId(null);
                }}
                title="Eliminar Regla"
                message="¿Estás seguro de que deseas eliminar esta regla? Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
            />
        </div>
    );
};
