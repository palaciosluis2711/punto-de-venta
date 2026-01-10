import React, { useState } from 'react';
import { useBrands, type Brand } from '../hooks/useBrands';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Plus, Trash2, Edit, Save, Image as ImageIcon, Briefcase } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import './BrandsSettings.css';

export const BrandsSettings: React.FC = () => {
    const { brands, addBrand, updateBrand, deleteBrand } = useBrands();

    // Add State
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newImage, setNewImage] = useState('');

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Edit State
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isEditing && editingBrand) {
                    setEditingBrand({ ...editingBrand, image: reader.result as string });
                } else {
                    setNewImage(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addBrand(newName.trim(), newDescription.trim(), newImage);
            setNewName('');
            setNewDescription('');
            setNewImage('');
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBrand && editingBrand.name.trim()) {
            updateBrand(
                editingBrand.id,
                editingBrand.name.trim(),
                editingBrand.description?.trim(),
                editingBrand.image
            );
            setEditingBrand(null);
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteBrand(deleteId);
            setDeleteId(null);
            setSelectedIds(prev => prev.filter(id => id !== deleteId));
        } else if (selectedIds.length > 0) {
            // Bulk delete logic
            selectedIds.forEach(id => deleteBrand(id));
            setSelectedIds([]);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(brands.map(b => b.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const isAllSelected = brands.length > 0 && selectedIds.length === brands.length;

    return (
        <div className="settings-container">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Marcas</h2>
                            <p className="header-subtitle">Administra las marcas de productos.</p>
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
                                <th className="th-text">Logo</th>
                                <th className="th-text">Nombre</th>
                                <th className="th-text">Descripción</th>
                                <th className="th-text th-actions">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="table-empty-message">
                                        No hay marcas registradas.
                                    </td>
                                </tr>
                            ) : (
                                brands.map((brand) => {
                                    const isSelected = selectedIds.includes(brand.id);
                                    return (
                                        <tr
                                            key={brand.id}
                                            className={`table-row ${isSelected ? 'selected' : ''}`}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(brand.id)}
                                                    className="cell-checkbox"
                                                />
                                            </td>
                                            <td className="cell-logo">
                                                <div className="logo-cell-box">
                                                    {brand.image ? (
                                                        <img src={brand.image} alt={brand.name} className="logo-preview-img" />
                                                    ) : (
                                                        <ImageIcon size={18} className="text-muted-icon" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="cell-name">{brand.name}</td>
                                            <td className="cell-description">{brand.description || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingBrand(brand)}
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => setDeleteId(brand.id)}
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

                {/* Add Form */}
                <form onSubmit={handleAdd} className="settings-form">
                    <div className="form-grid">
                        <Input
                            label="Nombre *"
                            placeholder="Nueva marca..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                        />
                        <Input
                            label="Descripción (Opcional)"
                            placeholder="Breve descripción..."
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-logo-section">
                        <div style={{ flex: 1 }}>
                            <div className="input-wrapper">
                                <label className="input-label">Logo (Opcional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="input-field"
                                    style={{ padding: '0.4rem' }}
                                    onChange={(e) => handleImageUpload(e)}
                                />
                            </div>
                        </div>
                        {newImage && (
                            <div className="logo-preview-box">
                                <img src={newImage} alt="Preview" className="logo-preview-img" />
                            </div>
                        )}
                        <div className="form-submit-wrapper">
                            <Button type="submit" disabled={!newName.trim()} icon={<Plus size={18} />}>
                                Agregar
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingBrand}
                onClose={() => setEditingBrand(null)}
                title="Editar Marca"
            >
                {editingBrand && (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <Input
                            label="Nombre"
                            value={editingBrand.name}
                            onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Descripción"
                            value={editingBrand.description || ''}
                            onChange={e => setEditingBrand({ ...editingBrand, description: e.target.value })}
                        />

                        <div className="input-wrapper">
                            <label className="input-label">Logo</label>
                            <div className="form-logo-section">
                                {editingBrand.image && (
                                    <div className="modal-logo-preview">
                                        <img src={editingBrand.image} alt="Preview" className="logo-preview-img" />
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="input-field"
                                        style={{ padding: '0.4rem' }}
                                        onChange={(e) => handleImageUpload(e, true)}
                                    />
                                    {editingBrand.image && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-danger mt-2"
                                            onClick={() => setEditingBrand({ ...editingBrand, image: '' })}
                                        >
                                            Quitar Logo
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <Button type="button" variant="outline" onClick={() => setEditingBrand(null)}>
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
                title={deleteId === 'bulk_action_placeholder' ? 'Eliminar Seleccionados' : 'Eliminar Marca'}
                message={deleteId === 'bulk_action_placeholder'
                    ? `¿Estás seguro de que deseas eliminar las ${selectedIds.length} marcas seleccionadas?`
                    : "¿Estás seguro de que deseas eliminar esta marca?"
                }
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                confirmText="Sí, eliminar"
            />
        </div >
    );
};
