import React, { useState } from 'react';
import { useCategories, type Category } from '../hooks/useCategories';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Plus, Trash2, Tag, Edit, Save } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import './CategoriesSettings.css';

export const CategoriesSettings: React.FC = () => {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
    // Add State
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Edit State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addCategory(newName.trim(), newDescription.trim());
            setNewName('');
            setNewDescription('');
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory && editingCategory.name.trim()) {
            updateCategory(editingCategory.id, editingCategory.name.trim(), editingCategory.description?.trim());
            setEditingCategory(null);
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteCategory(deleteId); // Assumes deleteCategory handles single ID
            setDeleteId(null);
            setSelectedIds(prev => prev.filter(id => id !== deleteId));
        } else if (selectedIds.length > 0) {
            // Bulk delete simulation - loops through IDs since we don't have a bulk delete API yet
            // In a real app, you'd want a bulkDelete API
            selectedIds.forEach(id => deleteCategory(id));
            setSelectedIds([]);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(categories.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;

    return (
        <div className="settings-container">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Categorías de Productos</h2>
                            <p className="header-subtitle">Administra las categorías disponibles para el inventario.</p>
                        </div>
                    </div>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="secondary"
                            className="bg-red-100 text-red-600 hover:bg-red-200"
                            onClick={() => setDeleteId('bulk_action_placeholder')}
                            icon={<Trash2 size={16} />}
                        >
                            Eliminar ({selectedIds.length})
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
                                <th className="th-text">Descripción</th>
                                <th className="th-text th-actions">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="table-empty-message">
                                        No hay categorías registradas.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => {
                                    const isSelected = selectedIds.includes(category.id);
                                    return (
                                        <tr
                                            key={category.id}
                                            className={`table-row ${isSelected ? 'selected' : ''}`}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(category.id)}
                                                    className="cell-checkbox"
                                                />
                                            </td>
                                            <td className="cell-name">{category.name}</td>
                                            <td className="cell-description">{category.description || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingCategory(category)}
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => setDeleteId(category.id)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
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
                            label="Nombre"
                            placeholder="Nueva categoría..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-input-group large">
                        <Input
                            label="Descripción (Opcional)"
                            placeholder="Breve descripción..."
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-submit-wrapper">
                        <Button type="submit" disabled={!newName.trim()} icon={<Plus size={18} />}>
                            Agregar
                        </Button>
                    </div>
                </form>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                title="Editar Categoría"
            >
                {editingCategory && (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <Input
                            label="Nombre"
                            value={editingCategory.name}
                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Descripción"
                            value={editingCategory.description || ''}
                            onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                        />
                        <div className="modal-actions">
                            <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
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
                title={deleteId === 'bulk_action_placeholder' ? 'Eliminar Seleccionados' : 'Eliminar Categoría'}
                message={deleteId === 'bulk_action_placeholder'
                    ? `¿Estás seguro de que deseas eliminar las ${selectedIds.length} categorías seleccionadas?`
                    : "¿Estás seguro de que deseas eliminar esta categoría? Esto podría afectar a productos existentes."
                }
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                confirmText="Sí, eliminar"
            />
        </div >
    );
};
