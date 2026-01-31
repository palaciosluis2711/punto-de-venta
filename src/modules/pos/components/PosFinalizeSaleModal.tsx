import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { usePaymentMethods } from '../../settings/hooks/usePaymentMethods';
import type { Client } from '../../clients/types';
import { DollarSign, Percent, Truck, Calculator, Banknote, User, MessageSquare } from 'lucide-react';
import './PosFinalizeSaleModal.css';

export interface FinalizeSaleData {
    receivedAmount: number;
    paymentMethod: string;
    discount: { type: 'fixed' | 'percent'; value: number };
    shipping: number;
    notes: {
        sale: string;
        payment: string;
        staff: string;
    };
    finalTotal: number;
    change: number;
}

interface PosFinalizeSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: FinalizeSaleData) => void;
    total: number;
    client: Client | null;
}

export const PosFinalizeSaleModal: React.FC<PosFinalizeSaleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    total,
    client
}) => {
    const { paymentMethods } = usePaymentMethods();

    // Form State
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');

    // Discount State
    const [discountValue, setDiscountValue] = useState<string>('');
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');

    // Shipping State
    const [shippingCost, setShippingCost] = useState<string>('');

    // Notes State
    const [saleNote, setSaleNote] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [staffNote, setStaffNote] = useState('');

    // Initialize State when opening
    useEffect(() => {
        if (isOpen) {
            setReceivedAmount(total.toFixed(2));
            setDiscountValue('');
            setDiscountType('fixed');
            setShippingCost('');
            setSaleNote('');
            setPaymentNote('');
            setStaffNote('');

            // Set default payment method
            const defaultMethod = paymentMethods.find(p => p.isDefault) || paymentMethods[0];
            if (defaultMethod) {
                setPaymentMethod(defaultMethod.name);
            }
        }
    }, [isOpen, total, paymentMethods]);

    // Calculations
    const finalTotal = useMemo(() => {
        let t = total;

        // Apply Discount
        const discVal = parseFloat(discountValue) || 0;
        if (discVal > 0) {
            if (discountType === 'percent') {
                t -= t * (discVal / 100);
            } else {
                t -= discVal;
            }
        }

        // Apply Shipping
        const shipVal = parseFloat(shippingCost) || 0;
        t += shipVal;

        return Math.max(0, t);
    }, [total, discountValue, discountType, shippingCost]);

    const change = useMemo(() => {
        const received = parseFloat(receivedAmount) || 0;
        return Math.max(0, received - finalTotal);
    }, [receivedAmount, finalTotal]);

    const handleQuickCash = (amount: number) => {
        setReceivedAmount(amount.toFixed(2));
    };

    const handleSubmit = () => {
        const received = parseFloat(receivedAmount) || 0;

        if (received < finalTotal) {
            alert('La cantidad recibida es menor al total a pagar.');
            return;
        }

        onConfirm({
            receivedAmount: received,
            paymentMethod,
            discount: {
                type: discountType,
                value: parseFloat(discountValue) || 0
            },
            shipping: parseFloat(shippingCost) || 0,
            notes: {
                sale: saleNote,
                payment: paymentNote,
                staff: staffNote
            },
            finalTotal,
            change
        });
    };

    const quickCashOptions = [5, 10, 20, 50, 100];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Finalizar Venta"
            maxWidth="800px"
        >
            <div className="finalize-modal-grid">
                {/* Left Column: Input Fields */}
                <div className="finalize-col-left">
                    <div className="section-title">
                        <User size={16} /> CLIENTE: {client?.fullName || 'Cliente General'}
                    </div>

                    {/* Payment Method */}
                    <div className="form-group">
                        <label>Método de Pago</label>
                        <div className="payment-methods-grid">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    type="button"
                                    className={`payment-method-chip ${paymentMethod === method.name ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod(method.name)}
                                >
                                    {method.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Received Amount & Quick Cash */}
                    <div className="form-group">
                        <label>Cantidad Recibida ($)</label>
                        <Input
                            type="number"
                            value={receivedAmount}
                            onChange={e => setReceivedAmount(e.target.value)}
                            className="input-large-text"
                            placeholder="0.00"
                        />
                        <div className="quick-cash-row">
                            {quickCashOptions.map(amount => (
                                <button
                                    key={amount}
                                    type="button"
                                    className="quick-cash-chip"
                                    onClick={() => handleQuickCash(amount)}
                                >
                                    ${amount}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Extra Costs & Discounts */}
                    <div className="costs-grid">
                        <div className="form-group">
                            <label>Descuento Global</label>
                            <div className="input-group-merged">
                                <Input
                                    type="number"
                                    value={discountValue}
                                    onChange={e => setDiscountValue(e.target.value)}
                                    placeholder="0.00"
                                />
                                <div className="toggle-group">
                                    <button
                                        type="button"
                                        className={discountType === 'percent' ? 'active' : ''}
                                        onClick={() => setDiscountType('percent')}
                                    >
                                        <Percent size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={discountType === 'fixed' ? 'active' : ''}
                                        onClick={() => setDiscountType('fixed')}
                                    >
                                        <DollarSign size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Costo de Envío ($)</label>
                            <div className="input-with-icon">
                                <Truck size={16} className="input-icon" />
                                <Input
                                    type="number"
                                    value={shippingCost}
                                    onChange={e => setShippingCost(e.target.value)}
                                    placeholder="0.00"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="form-group">
                        <label>Notas</label>
                        <div className="notes-stack">
                            <Input
                                placeholder="Nota de Venta (Visible en recibo)"
                                value={saleNote}
                                onChange={e => setSaleNote(e.target.value)}
                                icon={<MessageSquare size={16} />}
                            />
                            <Input
                                placeholder="Nota de Pago"
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                                icon={<Banknote size={16} />}
                            />
                            <Input
                                placeholder="Nota Interna (Personal)"
                                value={staffNote}
                                onChange={e => setStaffNote(e.target.value)}
                                icon={<User size={16} />}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="finalize-col-right">
                    <div className="summary-card">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        {parseFloat(discountValue) > 0 && (
                            <div className="summary-row discount">
                                <span>Descuento ({discountType === 'percent' ? `${discountValue}%` : '$'})</span>
                                <span>- ${discountType === 'percent' ? (total * parseFloat(discountValue) / 100).toFixed(2) : parseFloat(discountValue).toFixed(2)}</span>
                            </div>
                        )}
                        {parseFloat(shippingCost) > 0 && (
                            <div className="summary-row shipping">
                                <span>Envío</span>
                                <span>+ ${parseFloat(shippingCost).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-divider" />
                        <div className="summary-row total">
                            <span>Total a Pagar</span>
                            <span>${finalTotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-divider" />

                        <div className="summary-row highlight">
                            <span>Recibido</span>
                            <span>${(parseFloat(receivedAmount) || 0).toFixed(2)}</span>
                        </div>
                        <div className="summary-row change">
                            <span>Cambio</span>
                            <span>${change.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="submit-section">
                        <Button
                            className="btn-finalize"
                            onClick={handleSubmit}
                            disabled={parseFloat(receivedAmount || '0') < finalTotal}
                            style={{ width: '100%' }}
                            size="lg"
                        >
                            <Calculator size={20} className="mr-2" />
                            {Math.abs(change) < 0.01 ? 'Cobrar Exacto' : 'Cobrar y Dar Cambio'}
                        </Button>
                        <Button variant="ghost" onClick={onClose} style={{ width: '100%' }}>
                            Volver
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
