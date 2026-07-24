import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { useQuotes } from './hooks/useQuotes';
import { useStores } from '../settings/hooks/useStores';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { CustomSelect } from '../../shared/components/CustomSelect';
import { Modal } from '../../shared/components/Modal';
import { useToast } from '../../shared/components/Toast/useToast';
import './QuotesPage.css';

export const QuotesPage: React.FC = () => {
    const navigate = useNavigate();
    const { quotes, deleteQuote } = useQuotes();
    const { activeStoreId } = useStores();
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // View/Delete Modals
    const [viewingQuote, setViewingQuote] = useState<any>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

    // Filter quotes for the active store
    const storeQuotes = useMemo(() => {
        return quotes.filter(q => q.storeId === activeStoreId);
    }, [quotes, activeStoreId]);

    // Apply search and status filters
    const filteredQuotes = useMemo(() => {
        return storeQuotes.filter(q => {
            const matchesSearch = 
                q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                q.id.includes(searchQuery);
            const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [storeQuotes, searchQuery, statusFilter]);

    const confirmDelete = () => {
        if (quoteToDelete) {
            deleteQuote(quoteToDelete);
            showToast('Cotización eliminada exitosamente', 'info');
        }
        setIsConfirmDeleteOpen(false);
        setQuoteToDelete(null);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setQuoteToDelete(id);
        setIsConfirmDeleteOpen(true);
    };

    const handleRowClick = (quote: any) => {
        setViewingQuote(quote);
    };

    return (
        <div className="quotes-page animate-in">
            <div className="quotes-header">
                <div>
                    <h1 className="quotes-title">
                        <FileText className="text-primary" />
                        Cotizaciones
                    </h1>
                    <p className="text-muted">Gestiona los presupuestos y cotizaciones para tus clientes.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)} 
                        icon={<Filter size={16} />}
                    >
                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                    <Button onClick={() => navigate('/quotes/new')} icon={<Plus size={20} />}>
                        Nueva Cotización
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="quotes-filters-container animate-in fade-in slide-in-from-top-4 duration-300">
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <Input
                            placeholder="Buscar por ID o Cliente..."
                            icon={<Search size={18} />}
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ width: '200px' }}>
                        <CustomSelect
                            options={[
                                { value: 'all', label: 'Todos los estados' },
                                { value: 'draft', label: 'Borrador' },
                                { value: 'sent', label: 'Enviado' }
                            ]}
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="quotes-table-container">
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table className="quotes-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.length > 0 ? (
                                filteredQuotes.map(quote => (
                                    <tr key={quote.id} onClick={() => handleRowClick(quote)}>
                                        <td>
                                            {new Date(quote.date).toLocaleDateString()} {new Date(quote.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{quote.clientName}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                                            ${quote.total.toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${quote.status}`}>
                                                {quote.status === 'draft' ? 'Borrador' : 'Enviado'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/quotes/edit/${quote.id}`);
                                                    }}
                                                    title="Editar Cotización"
                                                >
                                                    Editar
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={(e) => handleDeleteClick(e, quote.id)}
                                                    className="text-danger border-danger hover:bg-danger/10"
                                                    title="Eliminar Cotización"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <FileText size={48} opacity={0.2} />
                                            <p>No se encontraron cotizaciones.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            <Modal
                isOpen={!!viewingQuote}
                onClose={() => setViewingQuote(null)}
                title={`Cotización - ${viewingQuote?.clientName}`}
                maxWidth="600px"
            >
                {viewingQuote && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Fecha</p>
                                <p style={{ fontWeight: 500, margin: 0 }}>
                                    {new Date(viewingQuote.date).toLocaleString()}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Estado</p>
                                <span className={`status-badge status-${viewingQuote.status}`}>
                                    {viewingQuote.status === 'draft' ? 'Borrador' : 'Enviado'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Productos Cotizados</h4>
                            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                                    <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>Producto</th>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>Cant.</th>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>Precio</th>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingQuote.items.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                                                    {item.productName}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                                                    {item.quantity}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                                                    ${item.unitPrice.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 500 }}>
                                                    ${item.subtotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                                <span>${viewingQuote.subtotal.toFixed(2)}</span>
                            </div>
                            {viewingQuote.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Descuento:</span>
                                    <span style={{ color: 'var(--danger)' }}>-${viewingQuote.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                <span>Total:</span>
                                <span style={{ color: 'var(--success)' }}>${viewingQuote.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <Button onClick={() => setViewingQuote(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                title="Eliminar Cotización"
                maxWidth="400px"
            >
                <div style={{ padding: '1rem 0' }}>
                    <p style={{ margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                        ¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-danger hover:bg-red-600 text-white"
                            style={{ backgroundColor: 'var(--error)' }}
                            onClick={confirmDelete}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
