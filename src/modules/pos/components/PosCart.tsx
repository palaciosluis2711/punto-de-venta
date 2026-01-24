import React, { useState } from 'react';
import { Minus, Plus, Trash2, CreditCard, ArrowLeft, Percent, DollarSign, Calculator } from 'lucide-react';
import type { CartItem } from '../hooks/useCart';
import { useRules } from '../../settings/hooks/useRules';
import { Button } from '../../../shared/components/Button';
import './PosCart.css';

interface PosCartProps {
    cart: CartItem[];
    total: number;
    onUpdateQuantity: (id: string, delta: number) => void;
    onSetQuantity: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
    onCheckout: () => void;
    onTogglePrice: (id: string, useSpecial: boolean) => void;
    onUpdateItem: (id: string, updates: Partial<CartItem>) => void;
}

export const PosCart: React.FC<PosCartProps> = ({
    cart,
    total,
    onUpdateQuantity,
    onSetQuantity,
    onRemove,
    onCheckout,
    onTogglePrice,
    onUpdateItem
}) => {
    const { rules } = useRules();
    const [activePriceEditId, setActivePriceEditId] = React.useState<string | null>(null);
    const [activeOptionMenuId, setActiveOptionMenuId] = React.useState<string | null>(null);
    const [showCustomDiscount, setShowCustomDiscount] = React.useState(false);
    const [customDiscountMode, setCustomDiscountMode] = React.useState<'select' | 'percent' | 'amount'>('select');
    const [showRules, setShowRules] = useState(false);

    // New: Popover positioning
    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number } | null>(null);

    // Reset custom discount state when menu changes
    React.useEffect(() => {
        if (!activeOptionMenuId) {
            setShowCustomDiscount(false);
            setCustomDiscountMode('select');
            setShowRules(false);
            setPopoverPosition(null);
        }
    }, [activeOptionMenuId]);

    // Handle click outside to close popovers
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeOptionMenuId || activePriceEditId) {
                const target = event.target as HTMLElement;
                const isInsideOptionMenu = target.closest('.options-popover');
                const isInsidePriceMenu = target.closest('.price-edit-popover');

                if (activeOptionMenuId && !isInsideOptionMenu) {
                    setActiveOptionMenuId(null);
                }
                if (activePriceEditId && !isInsidePriceMenu) {
                    setActivePriceEditId(null);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activeOptionMenuId, activePriceEditId]);

    const handlePriceClick = (item: CartItem) => {
        if (item.specialPrice !== undefined) {
            // For special price, we can keep the local popover or move it too. 
            // Keeping it local for now as user complained about Options menu specifically.
            setActivePriceEditId(item.id === activePriceEditId ? null : item.id);
            setActiveOptionMenuId(null);
        }
    };

    const handleNameClick = (item: CartItem, event: React.MouseEvent) => {
        if (item.specialPrice !== undefined) {
            handlePriceClick(item);
            return;
        }

        if (activeOptionMenuId === item.id) {
            setActiveOptionMenuId(null);
            return;
        }

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setPopoverPosition({
            top: rect.bottom + 5,
            left: rect.left
        });
        setActiveOptionMenuId(item.id);
        setActivePriceEditId(null);
    };

    const applyRule = (item: CartItem, ruleId: string) => {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return;

        try {
            const cost = item.cost || item.price;
            const price = item.price;
            let formula = rule.formula.toLowerCase();
            formula = formula.replace(/\bcost\b/g, cost.toString());
            formula = formula.replace(/\bprice\b/g, price.toString());

            if (!/^[\d\s+\-*/.()]+$/.test(formula)) {
                console.error("Formula contains invalid characters");
                return;
            }

            // eslint-disable-next-line no-new-func
            const newPrice = new Function(`return ${formula}`)();

            if (typeof newPrice === 'number' && !isNaN(newPrice) && newPrice >= 0) {
                onUpdateItem(item.id, { manualPrice: newPrice, discount: undefined });
                setActiveOptionMenuId(null);
            }
        } catch (e) {
            console.error("Error evaluating rule", e);
        }
    };

    const activeItem = activeOptionMenuId ? cart.find(c => c.id === activeOptionMenuId) : null;

    return (
        <div className="pos-cart-container">
            <div className="pos-cart-header">
                <h2>Carrito de Compra</h2>
                <span className="item-count">{cart.length} items</span>
            </div>

            <div className="pos-cart-items">
                {cart.map(item => (
                    <div
                        key={item.id}
                        className="cart-item"
                    >
                        <div className="cart-item-info">
                            <div>
                                <div
                                    className="cart-item-name hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNameClick(item, e);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {item.name}
                                </div>
                                {/* Popover REMOVED from here */}
                            </div>
                            <div
                                className={`cart-item-price ${item.discount ? 'text-pink-500 font-bold' : (item.isSpecialPrice ? 'text-success font-bold' : (item.manualPrice ? 'text-blue-600 font-bold' : ''))} cursor-pointer`}
                                onClick={() => handlePriceClick(item)}
                                title={item.isSpecialPrice ? "Precio de Paquete" : (item.manualPrice ? "Precio Manual" : "Precio Normal")}
                                style={{
                                    color: item.discount ? 'var(--pink-500, #ec4899)' : (item.isSpecialPrice ? 'var(--success)' : (item.manualPrice ? 'var(--primary)' : 'inherit')),
                                    position: 'relative'
                                }}
                            >
                                ${item.price.toFixed(2)}
                                {activePriceEditId === item.id && (
                                    <div
                                        className="price-edit-popover animate-in fade-in zoom-in-95"
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '0',
                                            minWidth: '220px',
                                            backgroundColor: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '0.75rem',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                            zIndex: 50,
                                            marginTop: '4px'
                                        }}
                                    >
                                        <div className="text-xs font-semibold mb-2 text-foreground pb-1 border-b">Seleccionar Precio</div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                className={`text-xs p-2 rounded flex justify-between items-center ${item.isSpecialPrice ? 'bg-success/20 text-success ring-1 ring-success' : 'hover:bg-muted text-muted-foreground'}`}
                                                style={{ width: '100%', padding: '0.5rem' }}
                                                onClick={() => {
                                                    onTogglePrice(item.id, true);
                                                    setActivePriceEditId(null);
                                                }}
                                                disabled={item.specialPrice === undefined}
                                            >
                                                <span className="font-medium">Paquete</span>
                                                <span>${item.specialPrice?.toFixed(2) ?? 'N/A'}</span>
                                            </button>
                                            <button
                                                className={`text-xs p-2 rounded flex justify-between items-center ${!item.isSpecialPrice && !item.manualPrice ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'hover:bg-muted text-muted-foreground'}`}
                                                style={{ width: '100%', padding: '0.5rem' }}
                                                onClick={() => {
                                                    onTogglePrice(item.id, false);
                                                    onUpdateItem(item.id, { manualPrice: undefined });
                                                    setActivePriceEditId(null);
                                                }}
                                            >
                                                <span className="font-medium">Normal</span>
                                                <span>${item.originalPrice.toFixed(2)}</span>
                                            </button>
                                            {item.manualPrice && (
                                                <button
                                                    className="text-xs p-2 rounded flex justify-between items-center bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                                                    style={{ width: '100%', padding: '0.5rem' }}
                                                    onClick={() => setActivePriceEditId(null)}
                                                >
                                                    <span className="font-medium">Manual</span>
                                                    <span>${item.manualPrice.toFixed(2)}</span>
                                                </button>
                                            )}
                                        </div>
                                        <button className="text-[10px] text-muted mt-2 w-full text-center hover:underline" onClick={() => setActivePriceEditId(null)}>Cerrar</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="cart-item-actions">
                            <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, -1)} disabled={item.quantity <= 1}><Minus size={14} /></button>
                            <input
                                type="number" className="qty-input" value={item.quantity}
                                onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val)) onSetQuantity(item.id, val); }}
                                onBlur={() => { if (!item.quantity || item.quantity < 1) onSetQuantity(item.id, 1); }}
                                min="1" max={item.stock}
                                style={{ color: item.quantity > item.stock ? 'var(--error)' : 'inherit' }}
                            />
                            <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, 1)} disabled={item.quantity >= item.stock}><Plus size={14} /></button>
                            <button className="remove-btn" onClick={() => onRemove(item.id)}><Trash2 size={16} /></button>
                        </div>
                        <div className="cart-item-total">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                ))}

                {cart.length === 0 && (
                    <div className="empty-cart"><div className="empty-cart-icon">🛒</div><p>El carrito está vacío</p></div>
                )}
            </div>

            <div className="pos-cart-footer">
                <div className="cart-summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                <div className="cart-summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
                <Button className="checkout-btn" size="lg" disabled={cart.length === 0} onClick={onCheckout} icon={<CreditCard size={20} />}>Cobrar</Button>
            </div>

            {/* Fixed Position Popover */}
            {activeItem && popoverPosition && (
                <div
                    className="options-popover"
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: Math.min(popoverPosition.top, window.innerHeight - 300), // Prevent going off-screen bottom
                        left: popoverPosition.left,
                        marginTop: 0,
                        zIndex: 9999, // High Z-Index to float above everything
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}
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
                        <h4 className="popover-header">Opciones: {activeItem.name}</h4>
                    </div>

                    {!showRules ? (
                        <>
                            <div className="popover-section">
                                <label className="popover-label">Descuento Fijo ($)</label>
                                <div className="popover-input-group">
                                    <input
                                        key={`${activeItem.id}-${activeItem.discount?.type === 'amount' ? activeItem.discount.value : 'none'}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="popover-input no-spinners"
                                        placeholder="0.00"
                                        defaultValue={activeItem.discount?.type === 'amount' ? activeItem.discount.value : ''}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseFloat(e.currentTarget.value);
                                                if (!isNaN(val) && val >= 0) {
                                                    onUpdateItem(activeItem.id, { discount: { type: 'amount', value: val } });
                                                    setActiveOptionMenuId(null);
                                                } else {
                                                    onUpdateItem(activeItem.id, { discount: undefined });
                                                }
                                            }
                                        }}
                                    // ... other input logical props identical to before ...
                                    />
                                    {activeItem.discount?.type === 'amount' && (
                                        <button
                                            className="popover-btn-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateItem(activeItem.id, { discount: undefined });
                                            }}
                                            title="Quitar descuento"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!activeItem.isSpecialPrice ? (
                                <div className="popover-section">
                                    <label className="popover-label">Descuentos y Reglas</label>
                                    {!showCustomDiscount ? (
                                        <div className="popover-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                            <button
                                                className="btn-soft btn-soft-primary"
                                                onClick={() => onUpdateItem(activeItem.id, { discount: { type: 'percent', value: 10 } })}
                                            >
                                                10%
                                            </button>
                                            <button
                                                className="btn-soft btn-soft-secondary"
                                                onClick={() => onUpdateItem(activeItem.id, { discount: { type: 'percent', value: 15 } })}
                                            >
                                                15%
                                            </button>
                                            <button
                                                className="btn-soft btn-soft-neutral"
                                                onClick={() => setShowCustomDiscount(true)}
                                            >
                                                Otro
                                            </button>
                                            <button
                                                className="btn-soft btn-soft-neutral col-span-3 flex items-center justify-center gap-2 mt-2"
                                                style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}
                                                onClick={() => setShowRules(true)}
                                            >
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
                                            {/* Simplified Custom Mode Logic: */}
                                            {customDiscountMode === 'percent' && (
                                                <div className="discount-input-mode">
                                                    <button className="discount-back-btn" onClick={() => setCustomDiscountMode('select')}><ArrowLeft size={16} /></button>
                                                    <div className="discount-input-wrapper">
                                                        <input
                                                            type="number" min="0" max="100" step="1"
                                                            className="discount-input-field has-right-icon no-spinners"
                                                            placeholder="0" autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const val = parseInt(e.currentTarget.value);
                                                                    if (val > 0) { onUpdateItem(activeItem.id, { discount: { type: 'percent', value: Math.min(100, val) } }); setShowCustomDiscount(false); }
                                                                }
                                                                if (e.key === 'Escape') setCustomDiscountMode('select');
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
                                                            type="number" min="0" step="0.01"
                                                            className="discount-input-field has-left-icon no-spinners"
                                                            placeholder="0.00" autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const val = parseFloat(e.currentTarget.value);
                                                                    if (val > 0) { onUpdateItem(activeItem.id, { discount: { type: 'amount', value: val } }); setShowCustomDiscount(false); }
                                                                }
                                                                if (e.key === 'Escape') setCustomDiscountMode('select');
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeItem.discount && (
                                        <div className="discount-badge">
                                            <span className="discount-badge-text">
                                                Aplicado: {activeItem.discount.type === 'percent' ? `$${((activeItem.price * activeItem.discount.value) / 100).toFixed(2)}` : `$${activeItem.discount.value.toFixed(2)}`}
                                            </span>
                                            <button className="btn-icon-remove" onClick={(e) => { e.stopPropagation(); onUpdateItem(activeItem.id, { discount: undefined }); }}><Trash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="popover-warning mb-4">
                                    Los descuentos no se pueden aplicar a paquetes.
                                </div>
                            )}

                            {activeItem.manualPrice !== undefined && (
                                <div className="discount-badge" style={{ marginTop: '0.5rem', borderColor: 'var(--primary)', backgroundColor: 'var(--surface-hover)' }}>
                                    <span className="discount-badge-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Precio Regla: ${activeItem.manualPrice.toFixed(2)}
                                    </span>
                                    <button
                                        className="btn-icon-remove text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateItem(activeItem.id, { manualPrice: undefined });
                                        }}
                                        title="Restablecer precio original"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="popover-section">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Selecciona una regla:</div>
                            <div className="flex flex-col gap-2">
                                {rules
                                    .filter(r => !r.targetCategories.length || (activeItem.category && r.targetCategories.includes(activeItem.category)))
                                    .filter(r => r.applyToBundles || !activeItem.associatedProducts?.length)
                                    .map(rule => {
                                        let previewPrice: number | null = null;
                                        try {
                                            const cost = activeItem.cost || activeItem.price;
                                            const price = activeItem.price;
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
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    marginBottom: '2px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                className="rule-item-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    applyRule(activeItem, rule.id);
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--border)';
                                                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{rule.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                                        Formula: <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--surface-hover)', padding: '0 4px', borderRadius: '4px' }}>{rule.formula}</span>
                                                    </div>
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
            )}
        </div>
    );
};
