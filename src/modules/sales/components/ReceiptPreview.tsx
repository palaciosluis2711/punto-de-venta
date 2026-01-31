import React, { forwardRef } from 'react';
import type { Sale } from '../types';
import type { TicketSettings } from '../../settings/hooks/useTicketSettings';
import './ReceiptPreview.css';

interface ReceiptPreviewProps {
    sale: Sale;
    settings: TicketSettings;
    width?: '80mm' | '57mm';
}

export const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ sale, settings, width = '80mm' }, ref) => {

    // Width configuration
    // 80mm approx 302px (ignoring margins) but usually 72-80mm print width.
    // 57mm approx 215px.
    const containerStyle = {
        width: width === '80mm' ? '300px' : '210px',
        fontSize: width === '80mm' ? '12px' : '10px',
        padding: '10px',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: "'Courier New', Courier, monospace", // Monospace for ticket feel
        margin: '0 auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    };

    return (
        <div ref={ref} className="receipt-preview-container" style={containerStyle}>
            {/* Header */}
            <div className="receipt-header" style={{ textAlign: 'center', marginBottom: '10px' }}>
                {settings.showLogo && settings.logoUrl && (
                    <img
                        src={settings.logoUrl}
                        alt="Logo"
                        style={{ maxWidth: '60%', maxHeight: '60px', marginBottom: '5px' }}
                    />
                )}
                {settings.storeName && <h2 style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '4px 0' }}>{settings.storeName}</h2>}
                {settings.showAddress && settings.address && <p style={{ margin: '2px 0' }}>{settings.address}</p>}
                {settings.phone && <p style={{ margin: '2px 0' }}>Tel: {settings.phone}</p>}
                {settings.rfc && <p style={{ margin: '2px 0' }}>RFC: {settings.rfc}</p>}
                {settings.website && <p style={{ margin: '2px 0' }}>{settings.website}</p>}
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

            {/* Sale Info */}
            <div className="receipt-info" style={{ marginBottom: '10px' }}>
                <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Fecha:</span>
                    <span>{new Date(sale.date).toLocaleString()}</span>
                </p>
                <p style={{ margin: '2px 0' }}>Ticket #: {sale.id.slice(-8).toUpperCase()}</p>
                {settings.showClient && (
                    <p style={{ margin: '2px 0' }}>Cliente: {sale.clientName}</p>
                )}
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px dashed black', textAlign: 'left' }}>
                        <th style={{ padding: '4px 0', fontWeight: 'bold' }}>Cant./Prod.</th>
                        <th style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                                <div>{item.quantity} x {item.productName}</div>
                                {item.quantity > 1 && (
                                    <div style={{ fontSize: '0.85em', color: '#444' }}>
                                        @ ${item.unitPrice.toFixed(2)}
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>
                                ${(item.subtotal).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

            {/* Totals */}
            <div className="receipt-totals" style={{ textAlign: 'right' }}>
                {/* Calculate Subtotal manually if needed or derive from sale */}
                <p style={{ margin: '4px 0' }}>
                    <strong>Total:</strong>
                    <span style={{ fontSize: '1.2em', marginLeft: '10px' }}>${sale.total.toFixed(2)}</span>
                </p>

                <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
                    Efectivo/Pago: ${sale.receivedAmount.toFixed(2)}
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
                    Cambio: ${sale.change.toFixed(2)}
                </p>

                <p style={{ margin: '8px 0', fontSize: '0.85em' }}>
                    Método: {sale.paymentMethod}
                </p>
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

            {/* Footer */}
            {settings.footerMessage && (
                <div style={{ textAlign: 'center', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                    <p>{settings.footerMessage}</p>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8em' }}>
                <p>Power by <strong>StationeryOS</strong></p>
            </div>
        </div>
    );
});
