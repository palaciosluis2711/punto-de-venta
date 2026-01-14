import React, { useState, useEffect } from 'react';
import { useStores, type Store } from '../hooks/useStores';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Plus, Trash2, Edit, Store as StoreIcon, Save, Star } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import './StoresSettings.css';

export const StoresSettings: React.FC = () => {
    const { stores, addStore, updateStore, deleteStore, setMainStore } = useStores();

    // Add State
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isMain, setIsMain] = useState(false);

    // Edit State
    const [editingStore, setEditingStore] = useState<Store | null>(null);

    // Persistence Effect
    useEffect(() => {
        const editId = localStorage.getItem('app_settings_stores_edit_id');
        if (editId && stores.length > 0 && !editingStore) {
            const found = stores.find(s => s.id === editId);
            if (found) setEditingStore(found);
        }
    }, [stores]);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addStore(newName.trim(), newAddress.trim(), newPhone.trim(), isMain);
            setNewName('');
            setNewAddress('');
            setNewPhone('');
            setIsMain(false);
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStore && editingStore.name.trim()) {
            updateStore(editingStore.id, {
                name: editingStore.name.trim(),
                address: editingStore.address?.trim(),
                phone: editingStore.phone?.trim(),
                isDefault: editingStore.isDefault
            });
            setEditingStore(null);
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteStore(deleteId);
            setDeleteId(null);
            setSelectedIds(prev => prev.filter(id => id !== deleteId));
        } else if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                const store = stores.find(s => s.id === id);
                if (store && !store.isDefault) {
                    deleteStore(id);
                }
            });
            setSelectedIds([]);
        }
    };
    // ...


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Only select non-default stores for potential deletion? 
            // Or select all and filter later. Let's select all but disable delete for default.
            setSelectedIds(stores.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const isAllSelected = stores.length > 0 && selectedIds.length === stores.length;

    // Filter out default store from bulk delete if selected
    const selectableToDelete = selectedIds.filter(id => {
        const store = stores.find(s => s.id === id);
        return store && !store.isDefault;
    });

    return (
        <div className="settings-container">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <StoreIcon size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Tiendas y Sucursales</h2>
                            <p className="header-subtitle">Administra las ubicaciones físicas de tu negocio.</p>
                        </div>
                    </div>
                    {selectableToDelete.length > 0 && (
                        <Button
                            variant="secondary"
                            className="bg-red-100 text-red-600 hover:bg-red-200"
                            onClick={() => setDeleteId('bulk_action_placeholder')}
                            icon={<Trash2 size={16} />}
                        >
                            Eliminar ({selectableToDelete.length})
                        </Button>
                    )}
                </div>
            </div>

            <div className="settings-content-wrapper">
                <div className="table-wrapper">
                    <table className="settings-table">
                        <thead className="settings-table-header">
                            <tr>
                                <th className="th-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th className="th-text">Nombre</th>
                                <th className="th-text">Dirección</th>
                                <th className="th-text">Teléfono</th>
                                <th className="th-text th-actions">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="table-empty-message">
                                        No hay tiendas registradas.
                                    </td>
                                </tr>
                            ) : (
                                stores.map((store) => {
                                    const isSelected = selectedIds.includes(store.id);
                                    return (
                                        <tr
                                            key={store.id}
                                            className={`table-row ${isSelected ? 'selected' : ''}`}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    disabled={store.isDefault}
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(store.id)}
                                                    className="cell-checkbox"
                                                />
                                            </td>
                                            <td className="cell-name">
                                                {store.name}
                                                {store.isDefault && <span className="badge-default ml-2">Principal</span>}
                                            </td>
                                            <td className="cell-description">{store.address || '-'}</td>
                                            <td className="cell-description">{store.phone || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {!store.isDefault && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setMainStore(store.id)}
                                                            title="Establecer como Tienda Principal"
                                                            className="text-yellow-500 hover:text-yellow-600"
                                                        >
                                                            <Star size={16} />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingStore(store);
                                                            localStorage.setItem('app_settings_stores_edit_id', store.id);
                                                        }}
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    {!store.isDefault && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-danger"
                                                            onClick={() => setDeleteId(store.id)}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <form onSubmit={handleAdd} className="settings-form">
                    <div className="form-input-group">
                        <Input
                            label="Nombre de la Tienda *"
                            placeholder="Ej. Sucursal Centro"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-input-group">
                        <Input
                            label="Dirección"
                            placeholder="Calle, Número, Colonia..."
                            value={newAddress}
                            onChange={e => setNewAddress(e.target.value)}
                        />
                    </div>
                    <div className="form-input-group">
                        <Input
                            label="Teléfono"
                            placeholder="Teléfono de contacto"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                        />
                    </div>
                    <div className="form-checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <input
                            type="checkbox"
                            id="isMainStore"
                            checked={isMain}
                            onChange={e => setIsMain(e.target.checked)}
                            style={{ width: '1.25em', height: '1.25em', accentColor: 'var(--primary)' }}
                        />
                        <label htmlFor="isMainStore" style={{ fontWeight: 500, color: 'var(--text-main)' }}>Establecer como Tienda Principal</label>
                    </div>
                    <div className="form-submit-wrapper">
                        <Button type="submit" disabled={!newName.trim()} icon={<Plus size={18} />}>
                            Agregar Tienda
                        </Button>
                    </div>
                </form>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingStore}
                onClose={() => {
                    setEditingStore(null);
                    localStorage.removeItem('app_settings_stores_edit_id');
                }}
                title="Editar Tienda"
            >
                {editingStore && (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <Input
                            label="Nombre"
                            value={editingStore.name}
                            onChange={e => setEditingStore({ ...editingStore, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Dirección"
                            value={editingStore.address || ''}
                            onChange={e => setEditingStore({ ...editingStore, address: e.target.value })}
                        />
                        <Input
                            label="Teléfono"
                            value={editingStore.phone || ''}
                            onChange={e => setEditingStore({ ...editingStore, phone: e.target.value })}
                        />

                        <div className="form-checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="checkbox"
                                id="editIsMainStore"
                                checked={editingStore.isDefault}
                                disabled={stores.find(s => s.id === editingStore.id)?.isDefault} // Disable if ALREADY default (saved state)
                                onChange={e => setEditingStore({ ...editingStore, isDefault: e.target.checked })}
                                style={{ width: '1.25em', height: '1.25em', accentColor: 'var(--primary)' }}
                            />
                            <label
                                htmlFor="editIsMainStore"
                                style={{
                                    fontWeight: 500,
                                    color: stores.find(s => s.id === editingStore.id)?.isDefault ? 'var(--text-muted)' : 'var(--text-main)',
                                    cursor: stores.find(s => s.id === editingStore.id)?.isDefault ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {stores.find(s => s.id === editingStore.id)?.isDefault ? 'Esta es la Tienda Principal' : 'Establecer como Tienda Principal'}
                            </label>
                        </div>

                        <div className="modal-actions">
                            <Button type="button" variant="outline" onClick={() => {
                                setEditingStore(null);
                                localStorage.removeItem('app_settings_stores_edit_id');
                            }}>
                                Cancelar
                            </Button>
                            <Button type="submit" icon={<Save size={18} />}>
                                Guardar
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                title={deleteId === 'bulk_action_placeholder' ? 'Eliminar Seleccionados' : 'Eliminar Tienda'}
                message={deleteId === 'bulk_action_placeholder'
                    ? `¿Estás seguro de que deseas eliminar las ${selectableToDelete.length} tiendas seleccionadas? (La tienda principal no se eliminará)`
                    : "¿Estás seguro de que deseas eliminar esta tienda? El stock asociado podría perderse si no se transfiere."
                }
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                confirmText="Sí, eliminar"
            />
        </div>
    );
};
