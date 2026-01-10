import React from 'react';
import type { Supplier } from '../types';
import { Edit, Trash2, Eye, Building } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import './SupplierTable.css'; // I'll reuse or create this

interface SupplierTableProps {
    suppliers: Supplier[];
    selectedIds: string[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
    onView: (supplier: Supplier) => void;
    onSelect: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
    suppliers,
    selectedIds,
    onEdit,
    onDelete,
    onView,
    onSelect,
    onSelectAll
}) => {
    const allSelected = suppliers.length > 0 && selectedIds.length === suppliers.length;

    return (
        <div className="table-container" style={{ overflowX: 'auto', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                        <th style={{ padding: '1rem', width: '40px' }}>
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Proveedor</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Contacto</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Ubicación</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map((supplier) => (
                        <tr
                            key={supplier.id}
                            style={{
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer', /* Indicate clickable */
                                backgroundColor: selectedIds.includes(supplier.id) ? 'var(--surface-hover)' : 'transparent'
                            }}
                            onClick={() => onView(supplier)}
                            className="hover:bg-surface-hover"
                        >
                            <td style={{ padding: '1rem' }} onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(supplier.id)}
                                    onChange={() => onSelect(supplier.id)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-full)',
                                        overflow: 'hidden',
                                        backgroundColor: 'var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {supplier.image ? (
                                            <img src={supplier.image} alt={supplier.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Building size={20} className="text-muted" />
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>{supplier.name}</span>
                                </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {supplier.email && <span className="text-muted" style={{ fontSize: '0.8rem' }}>{supplier.email}</span>}
                                    {supplier.phone && <span className="text-muted" style={{ fontSize: '0.8rem' }}>{supplier.phone}</span>}
                                </div>
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                {supplier.address || '-'}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Button variant="ghost" size="sm" onClick={() => onView(supplier)} title="Ver Detalles">
                                        <Eye size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onEdit(supplier)} title="Editar">
                                        <Edit size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => onDelete(supplier.id)} title="Eliminar">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {suppliers.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No hay proveedores registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
