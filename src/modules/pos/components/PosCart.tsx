import React from 'react';
import { Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import type { CartItem } from '../hooks/useCart';
import { Button } from '../../../shared/components/Button';
import './PosCart.css';

interface PosCartProps {
    cart: CartItem[];
    total: number;
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onCheckout: () => void;
}

export const PosCart: React.FC<PosCartProps> = ({
    cart,
    total,
    onUpdateQuantity,
    onRemove,
    onCheckout
}) => {
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
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-price">${item.price.toFixed(2)}</div>
                        </div>

                        <div className="cart-item-actions">
                            <button
                                className="qty-btn"
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="qty-value">{item.quantity}</span>
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
