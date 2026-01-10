import React, { useState } from 'react';
import { Plus, Search, Trash } from 'lucide-react';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { useSuppliers } from './hooks/useSuppliers';
import { SupplierTable } from './components/SupplierTable';
import { SupplierForm } from './components/SupplierForm';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import type { Supplier } from './types';

export const SuppliersPage: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, deleteSuppliers, searchSuppliers } = useSuppliers();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Dialog state
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; type: 'delete' | 'bulk-delete'; id?: string }>({
        isOpen: false,
        type: 'delete'
    });

    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const filteredSuppliers = searchQuery ? searchSuppliers(searchQuery) : suppliers;

    const handleAddClick = () => {
        setEditingSupplier(undefined);
        setIsFormModalOpen(true);
    };

    const handleEditClick = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsFormModalOpen(true);
    };

    const handleViewClick = (supplier: Supplier) => {
        setViewingSupplier(supplier);
        setIsDetailsModalOpen(true);
    };

    // Selection handlers
    const handleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredSuppliers.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    // Delete handlers
    const handleDeleteClick = (id: string) => {
        setDialogState({ isOpen: true, type: 'delete', id });
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setDialogState({ isOpen: true, type: 'bulk-delete' });
    };

    const confirmDelete = () => {
        if (dialogState.type === 'delete' && dialogState.id) {
            deleteSupplier(dialogState.id);
            // Remove from selection if it was selected
            setSelectedIds(prev => prev.filter(id => id !== dialogState.id));
        } else if (dialogState.type === 'bulk-delete') {
            deleteSuppliers(selectedIds);
            setSelectedIds([]);
        }
        setDialogState({ ...dialogState, isOpen: false });
    };

    const handleFormSubmit = (data: Omit<Supplier, 'id'>) => {
        if (editingSupplier) {
            updateSupplier(editingSupplier.id, data);
        } else {
            addSupplier(data);
        }
        setIsFormModalOpen(false);
    };

    return (
        <div className="animate-in flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Proveedores</h1>
                    <p className="text-muted">Gestiona tu red de proveedores.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="outline"
                            className="text-danger border-danger hover:bg-danger/10"
                            onClick={handleBulkDeleteClick}
                            icon={<Trash size={18} />}
                        >
                            Eliminar ({selectedIds.length})
                        </Button>
                    )}
                    <Button onClick={handleAddClick} icon={<Plus size={20} />}>
                        Nuevo Proveedor
                    </Button>
                </div>
            </div>

            <div style={{ maxWidth: '400px' }}>
                <Input
                    placeholder="Buscar por nombre o correo..."
                    icon={<Search size={18} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <SupplierTable
                suppliers={filteredSuppliers}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onView={handleViewClick}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={dialogState.isOpen}
                onCancel={() => setDialogState({ ...dialogState, isOpen: false })}
                onConfirm={confirmDelete}
                title={dialogState.type === 'delete' ? 'Eliminar Proveedor' : 'Eliminar Proveedores'}
                message={
                    dialogState.type === 'delete'
                        ? '¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.'
                        : `¿Estás seguro de que deseas eliminar los ${selectedIds.length} proveedores seleccionados? Esta acción no se puede deshacer.`
                }
                confirmText="Sí, eliminar"
            />

            {/* Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            >
                <SupplierForm
                    initialData={editingSupplier}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormModalOpen(false)}
                />
            </Modal>

            {/* Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title="Detalles del Proveedor"
            >
                {viewingSupplier && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {viewingSupplier.image ? (
                                <img src={viewingSupplier.image} alt={viewingSupplier.name} style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No Logo
                                </div>
                            )}
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{viewingSupplier.name}</h3>
                                <span className="text-muted">ID: {viewingSupplier.id}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Dirección</label>
                                <p>{viewingSupplier.address || 'No registrada'}</p>
                            </div>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Correo Electrónico</label>
                                <p>{viewingSupplier.email || 'No registrado'}</p>
                            </div>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Teléfono</label>
                                <p>{viewingSupplier.phone || 'No registrado'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'end' }}>
                            <Button onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
