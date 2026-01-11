import React from 'react';
import { Minus, Plus, Trash2, CreditCard, ArrowLeft, Percent, DollarSign } from 'lucide-react';
import type { CartItem } from '../hooks/useCart';
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
    const [activePriceEditId, setActivePriceEditId] = React.useState<string | null>(null);
    const [activeOptionMenuId, setActiveOptionMenuId] = React.useState<string | null>(null);
    const [showCustomDiscount, setShowCustomDiscount] = React.useState(false);
    const [customDiscountMode, setCustomDiscountMode] = React.useState<'select' | 'percent' | 'amount'>('select');

    // Reset custom discount state when menu changes
    React.useEffect(() => {
        if (!activeOptionMenuId) {
            setShowCustomDiscount(false);
            setCustomDiscountMode('select');
        }
    }, [activeOptionMenuId]);

    // Reset mode when closing custom discount view
    React.useEffect(() => {
        if (!showCustomDiscount) {
            setCustomDiscountMode('select');
        }
    }, [showCustomDiscount]);

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
            setActivePriceEditId(item.id === activePriceEditId ? null : item.id);
            setActiveOptionMenuId(null); // Close other menu
        }
    };

    const handleNameClick = (item: CartItem) => {
        if (item.specialPrice !== undefined) {
            handlePriceClick(item);
            return;
        }
        setActiveOptionMenuId(item.id === activeOptionMenuId ? null : item.id);
        setActivePriceEditId(null); // Close other menu
    };

    return (
        <div className="pos-cart-container">
            <div className="pos-cart-header">
                <h2>Carrito de Compra</h2>
                <span className="item-count">{cart.length} items</span>
            </div>

            <div className="pos-cart-items">
                {cart.map(item => (
                    <div key={item.id} className="cart-item">
                        <div className="cart-item-info">
                            <div style={{ position: 'relative' }}>
                                <div
                                    className="cart-item-name hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNameClick(item);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {item.name}
                                </div>
                                {activeOptionMenuId === item.id && (
                                    <div
                                        className="options-popover"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="popover-header-row">
                                            {showCustomDiscount && (
                                                <button
                                                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors -ml-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowCustomDiscount(false);
                                                    }}
                                                    title="Volver"
                                                >
                                                    <ArrowLeft size={16} />
                                                </button>
                                            )}
                                            <h4 className="popover-header">Opciones de Producto</h4>
                                        </div>

                                        <div className="popover-section">
                                            <label className="popover-label">Descuento Fijo ($)</label>
                                            <div className="popover-input-group">
                                                <input
                                                    key={`${item.id}-${item.discount?.type === 'amount' ? item.discount.value : 'none'}`}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="popover-input no-spinners"
                                                    placeholder="0.00"
                                                    defaultValue={item.discount?.type === 'amount' ? item.discount.value : ''}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = parseFloat(e.currentTarget.value);
                                                            if (!isNaN(val) && val >= 0) {
                                                                onUpdateItem(item.id, { discount: { type: 'amount', value: val } });
                                                                setActiveOptionMenuId(null);
                                                            } else {
                                                                onUpdateItem(item.id, { discount: undefined });
                                                            }
                                                        }
                                                        // Prevent non-numeric chars except navigation and dot
                                                        if (!/[\d\b\t.]/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Enter', 'Tab'].includes(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.currentTarget.value);
                                                        if (!isNaN(val) && val > 0) {
                                                            onUpdateItem(item.id, { discount: { type: 'amount', value: val } });
                                                        } else if (e.currentTarget.value === '' || val === 0) {
                                                            onUpdateItem(item.id, { discount: undefined });
                                                        }
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                />
                                                {item.discount?.type === 'amount' && (
                                                    <button
                                                        className="popover-btn-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateItem(item.id, { discount: undefined });
                                                        }}
                                                        title="Quitar descuento"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Discounts */}
                                        {!item.isSpecialPrice ? (
                                            <div className="popover-section">
                                                <label className="popover-label">Descuentos</label>
                                                {!showCustomDiscount ? (
                                                    <div className="popover-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                                        <button
                                                            className="btn-soft btn-soft-primary"
                                                            onClick={() => onUpdateItem(item.id, { discount: { type: 'percent', value: 10 } })}
                                                        >
                                                            10%
                                                        </button>
                                                        <button
                                                            className="btn-soft btn-soft-secondary"
                                                            onClick={() => onUpdateItem(item.id, { discount: { type: 'percent', value: 15 } })}
                                                        >
                                                            15%
                                                        </button>
                                                        <button
                                                            className="btn-soft btn-soft-neutral"
                                                            onClick={() => setShowCustomDiscount(true)}
                                                        >
                                                            Otro
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="discount-container">
                                                        {customDiscountMode === 'select' && (
                                                            <div className="discount-selectors">
                                                                <button
                                                                    className="discount-select-btn"
                                                                    onClick={() => setCustomDiscountMode('percent')}
                                                                    title="Porcentaje"
                                                                >
                                                                    <div className="discount-icon-circle icon-blue-soft">
                                                                        <Percent size={20} />
                                                                    </div>
                                                                </button>
                                                                <button
                                                                    className="discount-select-btn"
                                                                    onClick={() => setCustomDiscountMode('amount')}
                                                                    title="Monto Fijo"
                                                                >
                                                                    <div className="discount-icon-circle icon-green-soft">
                                                                        <DollarSign size={20} />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {customDiscountMode === 'percent' && (
                                                            <div className="discount-input-mode">
                                                                <button
                                                                    className="discount-back-btn"
                                                                    onClick={() => setCustomDiscountMode('select')}
                                                                    title="Volver a selección"
                                                                >
                                                                    <ArrowLeft size={16} />
                                                                </button>
                                                                <div className="discount-input-wrapper">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        step="1"
                                                                        className="discount-input-field has-right-icon no-spinners"
                                                                        placeholder="0"
                                                                        autoFocus
                                                                        defaultValue={item.discount?.type === 'percent' ? item.discount.value : ''}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                const val = parseInt(e.currentTarget.value);
                                                                                if (!isNaN(val) && val > 0) {
                                                                                    onUpdateItem(item.id, { discount: { type: 'percent', value: Math.min(100, val) } });
                                                                                    setShowCustomDiscount(false);
                                                                                } else {
                                                                                    onUpdateItem(item.id, { discount: undefined });
                                                                                    setShowCustomDiscount(false);
                                                                                }
                                                                            }
                                                                            if (e.key === 'Escape') {
                                                                                setCustomDiscountMode('select');
                                                                            }
                                                                            // Prevent non-numeric chars except navigation
                                                                            if (!/[\d\b\t]/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Enter', 'Tab'].includes(e.key)) {
                                                                                e.preventDefault();
                                                                            }
                                                                        }}
                                                                        onChange={(e) => {
                                                                            // Force integer 0-100 logic
                                                                            let val = parseInt(e.target.value);
                                                                            if (val > 100) e.target.value = '100';
                                                                            if (val < 0) e.target.value = '0';
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const val = parseInt(e.currentTarget.value);
                                                                            if (!isNaN(val) && val > 0) {
                                                                                onUpdateItem(item.id, { discount: { type: 'percent', value: Math.min(100, val) } });
                                                                            } else if (e.currentTarget.value === '' || val === 0) {
                                                                                if (item.discount?.type === 'percent') {
                                                                                    onUpdateItem(item.id, { discount: undefined });
                                                                                }
                                                                            }
                                                                        }}
                                                                        onWheel={(e) => e.currentTarget.blur()}
                                                                    />
                                                                    <span className="discount-input-icon icon-right">%</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {customDiscountMode === 'amount' && (
                                                            <div className="discount-input-mode">
                                                                <button
                                                                    className="discount-back-btn"
                                                                    onClick={() => setCustomDiscountMode('select')}
                                                                    title="Volver a selección"
                                                                >
                                                                    <ArrowLeft size={16} />
                                                                </button>
                                                                <div className="discount-input-wrapper">
                                                                    <span className="discount-input-icon icon-left">$</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        className="discount-input-field has-left-icon no-spinners"
                                                                        placeholder="0.00"
                                                                        autoFocus
                                                                        defaultValue={item.discount?.type === 'amount' ? item.discount.value : ''}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                const val = parseFloat(e.currentTarget.value);
                                                                                if (!isNaN(val) && val > 0) {
                                                                                    onUpdateItem(item.id, { discount: { type: 'amount', value: val } });
                                                                                    setShowCustomDiscount(false);
                                                                                } else {
                                                                                    onUpdateItem(item.id, { discount: undefined });
                                                                                    setShowCustomDiscount(false);
                                                                                }
                                                                            }
                                                                            if (e.key === 'Escape') {
                                                                                setCustomDiscountMode('select');
                                                                            }
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const val = parseFloat(e.currentTarget.value);
                                                                            if (!isNaN(val) && val > 0) {
                                                                                onUpdateItem(item.id, { discount: { type: 'amount', value: val } });
                                                                            } else if (e.currentTarget.value === '' || val === 0) {
                                                                                if (item.discount?.type === 'amount') {
                                                                                    onUpdateItem(item.id, { discount: undefined });
                                                                                }
                                                                            }
                                                                        }}
                                                                        onWheel={(e) => e.currentTarget.blur()}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {item.discount && (
                                                    <div className="discount-badge">
                                                        <span className="discount-badge-text">
                                                            Aplicado: {item.discount.type === 'percent'
                                                                ? `$${((item.price * item.discount.value) / 100).toFixed(2)}`
                                                                : `$${item.discount.value.toFixed(2)}`}
                                                        </span>
                                                        <button
                                                            className="btn-icon-remove"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateItem(item.id, { discount: undefined });
                                                            }}
                                                            title="Quitar descuento"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="popover-warning mb-4">
                                                Los descuentos no se pueden aplicar a paquetes.
                                            </div>
                                        )}


                                    </div>
                                )}
                            </div>
                            <div
                                className={`cart-item-price ${item.discount ? 'text-pink-500 font-bold' : (item.isSpecialPrice ? 'text-success font-bold' : '')} cursor-pointer`}
                                onClick={() => handlePriceClick(item)}
                                title={item.isSpecialPrice ? "Precio de Paquete" : "Precio Normal"}
                                style={{
                                    color: item.discount ? 'var(--pink-500, #ec4899)' : (item.isSpecialPrice ? 'var(--success)' : 'inherit'),
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
                                        <div className="text-xs font-semibold mb-2 text-foreground" style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>Seleccionar Precio</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button
                                                className={`text-xs p-2 rounded flex justify-between items-center ${item.isSpecialPrice ? 'bg-success/20 text-success ring-1 ring-success' : 'hover:bg-muted text-muted-foreground'}`}
                                                style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0.5rem' }}
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
                                                className={`text-xs p-2 rounded flex justify-between items-center ${!item.isSpecialPrice ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'hover:bg-muted text-muted-foreground'}`}
                                                style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0.5rem' }}
                                                onClick={() => {
                                                    onTogglePrice(item.id, false);
                                                    setActivePriceEditId(null);
                                                }}
                                            >
                                                <span className="font-medium">Normal</span>
                                                <span>${item.originalPrice.toFixed(2)}</span>
                                            </button>
                                        </div>
                                        <button
                                            className="text-[10px] text-muted mt-2 w-full text-center hover:text-foreground hover:underline"
                                            style={{ marginTop: '0.75rem' }}
                                            onClick={() => setActivePriceEditId(null)}
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="cart-item-actions">
                            <button
                                className="qty-btn"
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                            >
                                <Minus size={14} />
                            </button>
                            <input
                                type="number"
                                className="qty-input"
                                value={item.quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                        onSetQuantity(item.id, val);
                                    } else if (e.target.value === '') {
                                        // Allow clearing momentarily, effectively 0 or just handle it?
                                        // Ideally we don't want 0 in cart. But for editing experience... 
                                        // Let's passed 0/1/empty handling to parent or just keep it minimal.
                                        // If empty, let's just do nothing or set to 1?
                                        // Better: Let user type. If blur and empty, reset to 1. 
                                        // For now, simple standard behavior:
                                        // If NaN, don't update? Or update to 0?
                                    }
                                }}
                                onBlur={() => {
                                    if (!item.quantity || item.quantity < 1) {
                                        onSetQuantity(item.id, 1);
                                    }
                                }}
                                min="1"
                                max={item.stock}
                                style={{ color: item.quantity > item.stock ? 'var(--error)' : 'inherit' }}
                            />
                            <button
                                className="qty-btn"
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stock}
                            >
                                <Plus size={14} />
                            </button>

                            <button
                                className="remove-btn"
                                onClick={() => onRemove(item.id)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="cart-item-total">
                            ${(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                ))}

                {cart.length === 0 && (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <p>El carrito está vacío</p>
                    </div>
                )}
            </div>

            <div className="pos-cart-footer">
                <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row total">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>

                <Button
                    className="checkout-btn"
                    size="lg"
                    disabled={cart.length === 0}
                    onClick={onCheckout}
                    icon={<CreditCard size={20} />}
                >
                    Cobrar
                </Button>
            </div>
        </div>
    );
};
