import React from 'react';
import type { Client } from '../types';
import { Button } from '../../../shared/components/Button';
import { Edit, Trash2 } from 'lucide-react';

interface ClientTableProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onDelete: (id: string) => void;
    onView?: (client: Client) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({ clients, onEdit, onDelete, onView }) => {
    return (
        <div className="table-container animate-in fade-in" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Cliente</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Documento</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Contacto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Ubicación</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                No hay clientes registrados.
                            </td>
                        </tr>
                    ) : (
                        clients.map(client => (
                            <tr
                                key={client.id}
                                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                                onClick={() => onView?.(client)}
                                className="hover:bg-muted/5 transition-colors"
                            >
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 500 }}>{client.fullName}</span>
                                            {client.isDefault && (
                                                <div title="Cliente Default (Selección Automática)" style={{ color: 'var(--warning, #f59e0b)' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        {client.commercialActivity && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{client.commercialActivity}</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="badge badge-outline" style={{ width: 'fit-content', fontSize: '0.7rem', padding: '0 0.25rem', marginBottom: '0.1rem' }}>
                                            {client.documentType}
                                        </span>
                                        <span style={{ fontFamily: 'monospace' }}>{client.documentNumber}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {client.phone && <span>{client.phone}</span>}
                                        {client.email && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{client.email}</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{client.department}, {client.district}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }} title={client.address}>
                                            {client.address.length > 30 ? client.address.substring(0, 30) + '...' : client.address}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<Edit size={16} />}
                                            onClick={() => onEdit(client)}
                                            title="Editar"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-danger hover:bg-danger/10"
                                            icon={<Trash2 size={16} />}
                                            onClick={() => onDelete(client.id)}
                                            title="Eliminar"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
