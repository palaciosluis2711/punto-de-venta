import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Search, Plus, Minus, Trash2, Percent, DollarSign, Calculator } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { useInventory } from '../inventory/hooks/useInventory';
import { useStores } from '../settings/hooks/useStores';
import { useRules } from '../settings/hooks/useRules';
import { QuoteForm } from './components/QuoteForm';
import { useQuotes } from './hooks/useQuotes';
import '../pos/components/PosCart.css';
import type { Product } from '../inventory/types';
import type { QuoteItem } from './types';

export const QuoteCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { products } = useInventory();
    const { activeStoreId } = useStores();
    const { quotes } = useQuotes();
    const { rules } = useRules();

    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<QuoteItem[]>([]);

    // Editing items
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<number>(0);

    // Context Menu State
    const [activeOptionMenuId, setActiveOptionMenuId] = useState<string | null>(null);
    const [showCustomDiscount, setShowCustomDiscount] = useState(false);
    const [customDiscountMode, setCustomDiscountMode] = useState<'select' | 'percent' | 'amount'>('select');
    const [showRules, setShowRules] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number } | null>(null);

    // Reset custom discount state when menu changes
    useEffect(() => {
        if (!activeOptionMenuId) {
            setShowCustomDiscount(false);
            setCustomDiscountMode('select');
            setShowRules(false);
            setPopoverPosition(null);
        }
    }, [activeOptionMenuId]);

    // Handle click outside to close popovers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeOptionMenuId || editingItemId) {
                const target = event.target as HTMLElement;
                const isInsideOptionMenu = target.closest('.options-popover');
                const isInsidePriceMenu = target.closest('.price-edit-popover');

                if (activeOptionMenuId && !isInsideOptionMenu) {
                    setActiveOptionMenuId(null);
                }
                if (editingItemId && !isInsidePriceMenu) {
                    setEditingItemId(null);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activeOptionMenuId, editingItemId]);

    // Load existing quote if editing
    useEffect(() => {
        if (id) {
            const existingQuote = quotes.find(q => q.id === id);
            if (existingQuote) {
                setItems(existingQuote.items);
            }
        }
    }, [id, quotes]);

    const filteredProducts = React.useMemo(() => {
        if (!searchQuery) return [];
        const lower = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.barcode.includes(lower)
        );
    }, [searchQuery, products]);

    const handleUpdateItem = (productId: string, updates: Partial<QuoteItem>) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const updatedItem = { ...item, ...updates };
                // Ensure originalPrice exists for calculations
                const basePrice = updatedItem.originalPrice || updatedItem.unitPrice;
                updatedItem.originalPrice = basePrice; // Ensure it's persisted

                if (updates.manualPrice !== undefined) {
                    updatedItem.unitPrice = updates.manualPrice;
                } else if (updatedItem.discount) {
                    if (updatedItem.discount.type === 'percent') {
                        updatedItem.unitPrice = basePrice * (1 - updatedItem.discount.value / 100);
                    } else if (updatedItem.discount.type === 'amount') {
                        updatedItem.unitPrice = Math.max(0, basePrice - updatedItem.discount.value);
                    }
                } else if (updates.discount === undefined && updates.manualPrice === undefined) {
                    // Reset to original price if both are explicitly undefined
                    updatedItem.unitPrice = basePrice;
                }
                updatedItem.subtotal = updatedItem.unitPrice * updatedItem.quantity;
                return updatedItem;
            }
            return item;
        }));
    };

    const applyRule = (item: QuoteItem, ruleId: string) => {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return;

        try {
            const basePrice = item.originalPrice || item.unitPrice;
            const cost = item.unitCost || basePrice;
            let formula = rule.formula.toLowerCase();
            formula = formula.replace(/\bcost\b/g, cost.toString());
            formula = formula.replace(/\bprice\b/g, basePrice.toString());

            if (!/^[\d\s+\-*/.()]+$/.test(formula)) {
                console.error("Formula contains invalid characters");
                return;
            }

            // eslint-disable-next-line no-new-func
            const newPrice = new Function(`return ${formula}`)();
            if (typeof newPrice === 'number' && !isNaN(newPrice) && newPrice >= 0) {
                handleUpdateItem(item.productId, { manualPrice: newPrice, discount: undefined });
                setActiveOptionMenuId(null);
            }
        } catch (e) {
            console.error("Error evaluating rule", e);
        }
    };

    const handleNameClick = (item: QuoteItem, event: React.MouseEvent) => {
        if (item.isSpecialPrice) {
            return;
        }

        if (activeOptionMenuId === item.productId) {
            setActiveOptionMenuId(null);
            return;
        }

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setPopoverPosition({
            top: rect.bottom + 5,
            left: rect.left
        });
        setActiveOptionMenuId(item.productId);
        setEditingItemId(null);
    };

    const handleAddProduct = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id && !i.isSpecialPrice);
            if (existing) {
                return prev.map(i => i.productId === product.id && !i.isSpecialPrice
                    ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
                    : i
                );
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                originalPrice: product.price,
                subtotal: product.price,
                unitCost: product.cost,
                category: product.category
            }];
        });
        setSearchQuery('');
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery) {
            e.preventDefault();
            const exactBarcodeMatch = filteredProducts.find(p => p.barcode.toLowerCase() === searchQuery.toLowerCase());
            if (exactBarcodeMatch) {
                handleAddProduct(exactBarcodeMatch);
            } else if (filteredProducts.length === 1) {
                handleAddProduct(filteredProducts[0]);
            }
        }
    };

    const handleUpdateQuantity = (productId: string, isSpecialPrice: boolean, delta: number) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId && !!item.isSpecialPrice === isSpecialPrice) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
            }
            return item;
        }));
    };

    const handleSetQuantity = (productId: string, isSpecialPrice: boolean, qty: number) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId && !!item.isSpecialPrice === isSpecialPrice) {
                return { ...item, quantity: qty, subtotal: qty * item.unitPrice };
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string, isSpecialPrice: boolean) => {
        setItems(prev => prev.filter(item => !(item.productId === productId && !!item.isSpecialPrice === isSpecialPrice)));
    };


    return (
        <div className="animate-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.625rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/quotes')} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <FileText className="text-primary" />
                            {id ? 'Editar Cotización' : 'Nueva Cotización'}
                        </h1>
                        <p className="text-muted" style={{ margin: 0 }}>Arma el presupuesto añadiendo productos y aplicando descuentos.</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
                {/* Left Side: Product Search and Items List */}
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                        <Input
                            placeholder="Buscar producto por nombre o código para cotizar..."
                            icon={<Search size={20} />}
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            autoFocus
                        />
                        {/* Search Results Dropdown-like display inline */}
                        {searchQuery && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)', zIndex: 50, maxHeight: '300px', overflowY: 'auto',
                                boxShadow: 'var(--shadow-lg)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem'
                            }}>
                                {filteredProducts.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                                        No se encontraron productos coincidentes.
                                    </p>
                                )}
                                {filteredProducts.map(product => {
                                    const stock = product.inventory?.[activeStoreId] || 0;
                                    return (
                                        <div
                                            key={product.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.75rem',
                                                backgroundColor: 'var(--surface)',
                                                borderBottom: '1px solid var(--border)',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            <div>
                                                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{product.name}</h4>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    <span>Precio: ${product.price.toFixed(2)}</span>
                                                    <span>Stock Actual: {stock}</span>
                                                </div>
                                            </div>
                                            <Plus size={20} className="text-primary" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Items List (Productos Cotizados) */}
                    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Productos Cotizados ({items.length})</h3>
                        {items.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                                <p>No has añadido ningún producto.</p>
                                <p style={{ fontSize: '0.875rem' }}>Usa el buscador de arriba para comenzar.</p>
                            </div>
                        ) : (
                            <div className="pos-cart-items" style={{ padding: 0, rowGap: '0.2rem' }}>
                                {items.map((item, idx) => (
                                    <div key={`${item.productId}-${idx}`} className="cart-item" style={{ border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                                        <div
                                            className="cart-item-info"
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                handleNameClick(item, e);
                                            }}
                                        >
                                            <div>
                                                <div
                                                    className="cart-item-name hover:text-primary transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNameClick(item, e);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {item.productName}
                                                </div>
                                            </div>
                                            <div
                                                className={`cart-item-price ${item.discount ? 'text-pink-500 font-bold' : (item.manualPrice ? 'text-blue-600 font-bold' : '')} cursor-pointer`}
                                                onClick={() => { setEditingItemId(item.productId); setEditPrice(item.unitPrice); setActiveOptionMenuId(null); }}
                                                title={item.manualPrice ? "Precio Manual" : "Precio Normal"}
                                                style={{
                                                    color: item.discount ? 'var(--pink-500, #ec4899)' : (item.manualPrice ? 'var(--primary)' : 'inherit'),
                                                    position: 'relative'
                                                }}
                                            >
                                                ${item.unitPrice.toFixed(2)}
                                                {editingItemId === item.productId && (
                                                    <div
                                                        className="price-edit-popover animate-in fade-in zoom-in-95"
                                                        onClick={e => e.stopPropagation()}
                                                        style={{
                                                            position: 'absolute', top: '100%', right: '0', minWidth: '200px',
                                                            backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', zIndex: 50, marginTop: '8px'
                                                        }}
                                                    >
                                                        <div className="text-xs font-semibold mb-4 text-foreground pb-1 border-b">Modo de Precio</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                                                            <div className="flex gap-2">
                                                                <Input type="number" value={editPrice || ''} onChange={(e: any) => setEditPrice(parseFloat(e.target.value) || 0)} autoFocus />
                                                                <Button size="sm" onClick={() => { handleUpdateItem(item.productId, { manualPrice: editPrice, discount: undefined }); setEditingItemId(null); }}>OK</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {item.discount && (
                                                <div className="discount-badge" style={{ marginTop: '0.5rem' }}>
                                                    <span className="discount-badge-text">
                                                        Aplicado: {item.discount.type === 'percent' ? `$${(((item.originalPrice || item.unitPrice) * item.discount.value) / 100).toFixed(2)}` : `$${item.discount.value.toFixed(2)}`}
                                                    </span>
                                                    <button className="btn-icon-remove" onClick={(e) => { e.stopPropagation(); handleUpdateItem(item.productId, { discount: undefined }); }}><Trash2 size={12} /></button>
                                                </div>
                                            )}
                                            {item.manualPrice !== undefined && (
                                                <div className="discount-badge" style={{ marginTop: '0.5rem', borderColor: 'var(--primary)', backgroundColor: 'var(--surface-hover)' }}>
                                                    <span className="discount-badge-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                                        Precio Modificado
                                                    </span>
                                                    <button
                                                        className="btn-icon-remove text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateItem(item.productId, { manualPrice: undefined }); }}
                                                    ><Trash2 size={12} /></button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="cart-item-actions">
                                            <button className="qty-btn" onClick={() => handleUpdateQuantity(item.productId, !!item.isSpecialPrice, -1)} disabled={item.quantity <= 1}><Minus size={14} /></button>
                                            <input
                                                type="number" className="qty-input" value={item.quantity || ''}
                                                onChange={(e: any) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val)) handleSetQuantity(item.productId, !!item.isSpecialPrice, val);
                                                }}
                                            />
                                            <button className="qty-btn" onClick={() => handleUpdateQuantity(item.productId, !!item.isSpecialPrice, 1)}><Plus size={14} /></button>
                                            <button className="remove-btn" onClick={() => handleRemoveItem(item.productId, !!item.isSpecialPrice)}><Trash2 size={16} /></button>
                                        </div>
                                        <div className="cart-item-total">${item.subtotal.toFixed(2)}</div>
                                    </div>
                                ))}

                                {/* Global Popover for Options */}
                                {activeOptionMenuId && popoverPosition && (() => {
                                    const activeItem = items.find(i => i.productId === activeOptionMenuId);
                                    if (!activeItem) return null;
                                    return (
                                        <div
                                            className="options-popover"
                                            style={{
                                                position: 'fixed',
                                                top: Math.min(popoverPosition.top, window.innerHeight - 300),
                                                left: popoverPosition.left,
                                                marginTop: 0,
                                                zIndex: 9999,
                                                maxHeight: '400px',
                                                overflowY: 'auto'
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="popover-header-row">
                                                {(showCustomDiscount || showRules) && (
                                                    <button
                                                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors -ml-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowCustomDiscount(false);
                                                            setShowRules(false);
                                                        }}
                                                        title="Volver"
                                                    >
                                                        <ArrowLeft size={16} />
                                                    </button>
                                                )}
                                                <h4 className="popover-header">Opciones: {activeItem.productName}</h4>
                                            </div>

                                            {!showRules ? (
                                                <>
                                                    <div className="popover-section">
                                                        <label className="popover-label">Descuento Fijo ($)</label>
                                                        <div className="popover-input-group">
                                                            <input
                                                                key={`${activeItem.productId}-${activeItem.discount?.type === 'amount' ? activeItem.discount.value : 'none'}`}
                                                                type="number" min="0" step="0.01" className="popover-input no-spinners" placeholder="0.00"
                                                                defaultValue={activeItem.discount?.type === 'amount' ? activeItem.discount.value : ''}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const val = parseFloat(e.currentTarget.value);
                                                                        if (!isNaN(val) && val >= 0) {
                                                                            handleUpdateItem(activeItem.productId, { discount: { type: 'amount', value: val } });
                                                                            setActiveOptionMenuId(null);
                                                                        } else {
                                                                            handleUpdateItem(activeItem.productId, { discount: undefined });
                                                                        }
                                                                    }
                                                                }}
                                                                onBlur={(e) => {
                                                                    const val = parseFloat(e.currentTarget.value);
                                                                    if (!isNaN(val) && val >= 0) {
                                                                        handleUpdateItem(activeItem.productId, { discount: { type: 'amount', value: val } });
                                                                    }
                                                                }}
                                                            />
                                                            {activeItem.discount?.type === 'amount' && (
                                                                <button
                                                                    className="popover-btn-icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleUpdateItem(activeItem.productId, { discount: undefined });
                                                                    }}
                                                                    title="Quitar descuento"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="popover-section">
                                                        <label className="popover-label">Descuentos y Reglas</label>
                                                        {!showCustomDiscount ? (
                                                            <div className="popover-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                                                <button className="btn-soft btn-soft-primary" onClick={() => { handleUpdateItem(activeItem.productId, { discount: { type: 'percent', value: 10 } }); setActiveOptionMenuId(null); }}>10%</button>
                                                                <button className="btn-soft btn-soft-secondary" onClick={() => { handleUpdateItem(activeItem.productId, { discount: { type: 'percent', value: 15 } }); setActiveOptionMenuId(null); }}>15%</button>
                                                                <button className="btn-soft btn-soft-neutral" onClick={() => setShowCustomDiscount(true)}>Otro</button>
                                                                <button className="btn-soft btn-soft-neutral col-span-3 flex items-center justify-center gap-2 mt-2" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }} onClick={() => setShowRules(true)}>
                                                                    <Calculator size={14} /> Aplicar Regla
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="discount-container">
                                                                {customDiscountMode === 'select' && (
                                                                    <div className="discount-selectors">
                                                                        <button className="discount-select-btn" onClick={() => setCustomDiscountMode('percent')}><div className="discount-icon-circle icon-blue-soft"><Percent size={20} /></div></button>
                                                                        <button className="discount-select-btn" onClick={() => setCustomDiscountMode('amount')}><div className="discount-icon-circle icon-green-soft"><DollarSign size={20} /></div></button>
                                                                    </div>
                                                                )}
                                                                {customDiscountMode === 'percent' && (
                                                                    <div className="discount-input-mode">
                                                                        <button className="discount-back-btn" onClick={() => setCustomDiscountMode('select')}><ArrowLeft size={16} /></button>
                                                                        <div className="discount-input-wrapper">
                                                                            <input
                                                                                type="number" min="0" max="100" step="1" className="discount-input-field has-right-icon no-spinners" placeholder="0" autoFocus
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        const val = parseInt(e.currentTarget.value);
                                                                                        if (val > 0) { handleUpdateItem(activeItem.productId, { discount: { type: 'percent', value: Math.min(100, val) } }); setActiveOptionMenuId(null); }
                                                                                    }
                                                                                    if (e.key === 'Escape') setCustomDiscountMode('select');
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    const val = parseInt(e.currentTarget.value);
                                                                                    if (val > 0) { handleUpdateItem(activeItem.productId, { discount: { type: 'percent', value: Math.min(100, val) } }); setActiveOptionMenuId(null); }
                                                                                }}
                                                                            /><span className="discount-input-icon icon-right">%</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {customDiscountMode === 'amount' && (
                                                                    <div className="discount-input-mode">
                                                                        <button className="discount-back-btn" onClick={() => setCustomDiscountMode('select')}><ArrowLeft size={16} /></button>
                                                                        <div className="discount-input-wrapper">
                                                                            <span className="discount-input-icon icon-left">$</span>
                                                                            <input
                                                                                type="number" min="0" step="0.01" className="discount-input-field has-left-icon no-spinners" placeholder="0.00" autoFocus
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        const val = parseFloat(e.currentTarget.value);
                                                                                        if (val > 0) { handleUpdateItem(activeItem.productId, { discount: { type: 'amount', value: val } }); setActiveOptionMenuId(null); }
                                                                                    }
                                                                                    if (e.key === 'Escape') setCustomDiscountMode('select');
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    const val = parseFloat(e.currentTarget.value);
                                                                                    if (val > 0) { handleUpdateItem(activeItem.productId, { discount: { type: 'amount', value: val } }); setActiveOptionMenuId(null); }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="popover-section">
                                                    <div className="text-xs font-medium text-muted-foreground mb-2">Selecciona una regla:</div>
                                                    <div className="flex flex-col gap-2">
                                                        {rules.map(rule => {
                                                            let previewPrice: number | null = null;
                                                            try {
                                                                const cost = activeItem.unitCost || activeItem.originalPrice;
                                                                const price = activeItem.originalPrice;
                                                                let formula = rule.formula.toLowerCase();
                                                                formula = formula.replace(/\bcost\b/g, cost.toString());
                                                                formula = formula.replace(/\bprice\b/g, price.toString());
                                                                if (/^[\d\s+\-*/.()]+$/.test(formula)) {
                                                                    const val = new Function(`return ${formula}`)();
                                                                    if (typeof val === 'number' && !isNaN(val) && val >= 0) previewPrice = val;
                                                                }
                                                            } catch (e) { /* ignore */ }

                                                            return (
                                                                <button
                                                                    key={rule.id}
                                                                    style={{
                                                                        width: '100%', textAlign: 'left', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                                                        backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex',
                                                                        justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px'
                                                                    }}
                                                                    className="rule-item-btn"
                                                                    onClick={(e) => { e.stopPropagation(); applyRule(activeItem, rule.id); }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                                                                >
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{rule.name}</div>
                                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>Formula: <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--surface-hover)', padding: '0 4px', borderRadius: '4px' }}>{rule.formula}</span></div>
                                                                    </div>
                                                                    {previewPrice !== null && (
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>${previewPrice.toFixed(2)}</div>
                                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Nuevo Precio</div>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                        {rules.length === 0 && (
                                                            <div className="text-center py-4 text-xs text-muted-foreground bg-muted/20 rounded border border-dashed">
                                                                No hay reglas configuradas.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Quote Form (Summary & Actions) */}
                <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <QuoteForm quoteId={id} items={items} onSaved={() => navigate('/quotes')} />
                </div>
            </div>
        </div>
    );
};

