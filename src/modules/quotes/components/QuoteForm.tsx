import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Send, User } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { CustomSelect } from '../../../shared/components/CustomSelect';
import { Input } from '../../../shared/components/Input';
import { useClients } from '../../clients/hooks/useClients';
import { useStores } from '../../settings/hooks/useStores';
import { useQuotes } from '../hooks/useQuotes';
import { useToast } from '../../../shared/components/Toast/useToast';
import type { Quote, QuoteItem } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface QuoteFormProps {
    quoteId?: string;
    items: QuoteItem[];
    onSaved: () => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ quoteId, items, onSaved }) => {
    const { clients } = useClients();
    const { activeStoreId, stores } = useStores();
    const { quotes, addQuote, updateQuote } = useQuotes();
    const { showToast } = useToast();
    const pdfRef = useRef<HTMLDivElement>(null);

    const activeStoreName = stores.find(s => s.id === activeStoreId)?.name || 'Tienda Principal';

    const [clientName, setClientName] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    const [isManualClient, setIsManualClient] = useState(false);
    const [manualClientName, setManualClientName] = useState('');
    const [manualClientEmail, setManualClientEmail] = useState('');

    // Initialize from existing quote if editing
    useEffect(() => {
        if (quoteId) {
            const existingQuote = quotes.find(q => q.id === quoteId);
            if (existingQuote) {
                if (existingQuote.clientEmail) {
                    setIsManualClient(true);
                    setManualClientName(existingQuote.clientName === 'Cliente General' ? '' : existingQuote.clientName);
                    setManualClientEmail(existingQuote.clientEmail);
                } else {
                    setClientName(existingQuote.clientName === 'Cliente General' ? '' : existingQuote.clientName);
                }
            }
        }
    }, [quoteId, quotes]);

    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const total = subtotal;

    // Client Autocomplete Logic
    const filteredClients = clients.filter(c => 
        c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) || 
        (c.documentNumber && c.documentNumber.includes(clientSearch))
    );

    const constructQuoteObject = (status: 'draft' | 'sent'): Quote => {
        return {
            id: quoteId || `Q-${Date.now()}`,
            date: new Date().toISOString(),
            clientName: isManualClient ? manualClientName : clientName,
            clientEmail: isManualClient ? manualClientEmail : undefined,
            storeId: activeStoreId,
            storeName: activeStoreName,
            items,
            subtotal,
            discount: 0,
            total,
            status
        };
    };

    const handleSaveDraft = () => {
        if (items.length === 0) {
            showToast('Añade al menos un producto', 'warning');
            return;
        }
        const quote = constructQuoteObject('draft');
        if (quoteId) updateQuote(quoteId, quote);
        else addQuote(quote);
        showToast('Cotización guardada como borrador', 'success');
        onSaved();
    };

    const handleExportPDF = () => {
        if (items.length === 0) {
            showToast('Añade al menos un producto', 'warning');
            return;
        }

        const element = pdfRef.current;
        if (!element) return;

        // Briefly show the PDF layout wrapper
        element.style.display = 'block';

        const opt = {
            margin:       1,
            filename:     `Cotizacion_${clientName || 'General'}_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            element.style.display = 'none';
            const quote = constructQuoteObject('sent');
            if (quoteId) updateQuote(quoteId, quote);
            else addQuote(quote);
            showToast('Cotización exportada a PDF', 'success');
            onSaved();
        });
    };

    const handleSendEmail = () => {
        if (items.length === 0) {
            showToast('Añade al menos un producto', 'warning');
            return;
        }
        
        // Simulating email send
        showToast(`Cotización enviada exitosamente a ${clientName || 'el cliente'} (Simulación)`, 'success');
        const quote = constructQuoteObject('sent');
        if (quoteId) updateQuote(quoteId, quote);
        else addQuote(quote);
        onSaved();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Client Section */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', flex: 1 }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                    <User size={18} /> Cliente
                </h3>
                <CustomSelect
                    value={clientName}
                    disabled={isManualClient}
                    onChange={(e: any) => setClientName(e.target.value)}
                    options={[
                        { label: 'Seleccionar', value: '' },
                        ...clients.map(c => ({
                            label: `${c.fullName} ${c.documentNumber ? `(${c.documentNumber})` : ''}`,
                            value: c.fullName
                        }))
                    ]}
                />
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                        type="checkbox" 
                        id="manualClientCheck" 
                        checked={isManualClient} 
                        onChange={(e) => {
                            setIsManualClient(e.target.checked);
                            if (e.target.checked) {
                                setClientName(''); // Reset dropdown to 'Seleccionar'
                            }
                        }} 
                    />
                    <label htmlFor="manualClientCheck" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Ingresar cliente manualmente</label>
                </div>

                {isManualClient && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        <Input
                            placeholder="Nombre del cliente"
                            value={manualClientName}
                            onChange={(e: any) => setManualClientName(e.target.value)}
                        />
                        <Input
                            placeholder="Correo electrónico"
                            type="email"
                            value={manualClientEmail}
                            onChange={(e: any) => setManualClientEmail(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Totals */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--success)' }}>${total.toFixed(2)}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Button 
                        variant="primary" 
                        onClick={handleExportPDF} 
                        icon={<Download size={18} />} 
                        style={{ width: '100%' }}
                        disabled={items.length === 0 || (isManualClient ? !manualClientName.trim() : !clientName.trim())}
                    >
                        Exportar PDF
                    </Button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                            variant="outline" 
                            onClick={handleSaveDraft} 
                            icon={<Save size={18} />} 
                            style={{ flex: 1 }}
                            disabled={items.length === 0}
                        >
                            Borrador
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleSendEmail} 
                            icon={<Send size={18} />} 
                            style={{ flex: 1 }}
                            disabled={items.length === 0 || (isManualClient ? !manualClientName.trim() : !clientName.trim())}
                        >
                            Correo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Hidden PDF Template */}
            <div style={{ display: 'none' }}>
                <div ref={pdfRef} style={{ padding: '40px', fontFamily: 'sans-serif', color: '#000', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div>
                            <h1 style={{ margin: '0 0 10px 0' }}>COTIZACIÓN</h1>
                            <p style={{ margin: 0 }}><strong>{activeStoreName}</strong></p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: '0 0 5px 0' }}><strong>ID:</strong> {quoteId || 'NUEVA'}</p>
                            <p style={{ margin: 0 }}><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Datos del Cliente</h3>
                        <p style={{ margin: 0 }}><strong>Nombre:</strong> {clientName || 'Cliente General'}</p>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Producto</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Cantidad</th>
                                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Precio Unit.</th>
                                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{item.productName}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{item.quantity}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>${item.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>${item.subtotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ width: '300px', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #000', fontWeight: 'bold', fontSize: '18px' }}>
                            <span>Total a Pagar:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '50px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                        <p>Este documento es una cotización informativa y no representa una factura legal.</p>
                        <p>Precios sujetos a cambios sin previo aviso.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
