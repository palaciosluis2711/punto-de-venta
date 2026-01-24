import React from 'react';
import type { Client } from '../types';
import { Button } from '../../../shared/components/Button';
import { User } from 'lucide-react';

interface ClientDetailsProps {
    client: Client;
    onClose: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onClose }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={32} className="text-muted" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{client.fullName}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>{client.documentType}: {client.documentNumber}</span>
                        {client.isLargeTaxpayer && (
                            <span className="badge badge-warning" style={{ width: 'fit-content' }}>Gran Contribuyente</span>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label className="text-muted" style={{ fontSize: '0.875rem' }}>Actividad Comercial</label>
                    <p>{client.commercialActivity || 'No registrada'}</p>
                </div>

                <div className="detail-item">
                    <label className="text-muted" style={{ fontSize: '0.875rem' }}>NCR</label>
                    <p>{client.ncr || 'N/A'}</p>
                </div>

                <div className="detail-item">
                    <label className="text-muted" style={{ fontSize: '0.875rem' }}>Teléfono</label>
                    <p>{client.phone || 'No registrado'}</p>
                </div>

                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label className="text-muted" style={{ fontSize: '0.875rem' }}>Correo Electrónico</label>
                    <p>{client.email || 'No registrado'}</p>
                </div>

                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label className="text-muted" style={{ fontSize: '0.875rem' }}>Ubicación</label>
                    <p>{client.address}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {[client.municipality, client.district, client.department, client.country].filter(Boolean).join(', ')}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'end' }}>
                <Button onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};
