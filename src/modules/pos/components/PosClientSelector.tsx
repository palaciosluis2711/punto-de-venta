import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, Plus, Edit, UserPlus } from 'lucide-react';
import type { Client } from '../../clients/types';
import { Button } from '../../../shared/components/Button';

interface PosClientSelectorProps {
    selectedClient: Client | null;
    onSelect: (client: Client | null) => void;
    onEdit: (client: Client) => void;
    onAdd: () => void;
    searchClients: (query: string) => Client[];
}

export const PosClientSelector: React.FC<PosClientSelectorProps> = ({
    selectedClient,
    onSelect,
    onEdit,
    onAdd,
    searchClients
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<Client[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            setResults(searchClients(query));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchClients]);

    // Click outside to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (selectedClient) {
        return (
            <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--primary)'
                        }}>
                            <User size={20} />
                        </div>
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                {selectedClient.fullName}
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                {selectedClient.documentType}: {selectedClient.documentNumber || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            style={{ height: '2rem', width: '2rem', padding: 0 }}
                            onClick={() => onEdit(selectedClient)}
                            title="Editar cliente"
                        >
                            <Edit size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            style={{ height: '2rem', width: '2rem', padding: 0, color: 'var(--muted-foreground)' }}
                            onClick={() => onSelect(null)}
                            title="Desvincular cliente"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    style={{
                        width: '100%',
                        height: '2.5rem',
                        paddingLeft: '2.25rem',
                        paddingRight: '2.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'box-shadow 0.2s'
                    }}
                    placeholder="Buscar cliente..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />

                {query ? (
                    <button
                        style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '0.625rem',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--muted-foreground)',
                            padding: 0
                        }}
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                        }}
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <button
                        style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '0.375rem',
                            padding: '0.25rem',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--primary)',
                            borderRadius: '4px'
                        }}
                        onClick={onAdd}
                        title="Nuevo Cliente"
                    >
                        <UserPlus size={18} />
                    </button>
                )}
            </div>

            {isOpen && query && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 50,
                    maxHeight: '15rem',
                    overflowY: 'auto'
                }}>
                    {results.length > 0 ? (
                        <div style={{ padding: '0.25rem 0' }}>
                            {results.map(client => (
                                <button
                                    key={client.id}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.5rem 0.75rem',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: '1px solid var(--border-light)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        transition: 'background-color 0.2s'
                                    }}
                                    className="hover:bg-muted"
                                    onClick={() => {
                                        onSelect(client);
                                        setQuery('');
                                        setIsOpen(false);
                                    }}
                                >
                                    <div style={{
                                        width: '2rem',
                                        height: '2rem',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <User size={14} className="text-muted-foreground" />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.fullName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            {client.documentNumber}
                                            {client.phone && ` • ${client.phone}`}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>No se encontraron clientes</p>
                            <Button size="sm" onClick={onAdd} style={{ width: '100%' }}>
                                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                                Crear Cliente
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
