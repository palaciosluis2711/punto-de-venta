import React, { useState } from 'react';
import { useUnits, type Unit } from '../hooks/useUnits';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Plus, Trash2, Scale, Edit, Save } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import './UnitsSettings.css';

export const UnitsSettings: React.FC = () => {
    const { units, addUnit, updateUnit, deleteUnit } = useUnits();

    // Add State
    const [newName, setNewName] = useState('');
    const [newAbbrev, setNewAbbrev] = useState('');
    const [newIsComposite, setNewIsComposite] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Edit State
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addUnit(newName.trim(), newAbbrev.trim(), newIsComposite);
            setNewName('');
            setNewAbbrev('');
            setNewIsComposite(false);
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit && editingUnit.name.trim()) {
            updateUnit(editingUnit.id, editingUnit.name.trim(), editingUnit.abbreviation?.trim(), editingUnit.is_composite);
            setEditingUnit(null);
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteUnit(deleteId);
            setDeleteId(null);
            setSelectedIds(prev => prev.filter(id => id !== deleteId));
        } else if (selectedIds.length > 0) {
            // Bulk delete logic
            selectedIds.forEach(id => deleteUnit(id));
            setSelectedIds([]);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(units.map(u => u.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const isAllSelected = units.length > 0 && selectedIds.length === units.length;

    return (
        <div className="settings-container">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Unidades de Medida</h2>
                            <p className="header-subtitle">Define las unidades para tus productos (pza, kg, caja, etc.).</p>
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
                                <th className="th-text">Abreviatura</th>
                                <th className="th-text">Tipo</th>
                                <th className="th-text th-actions">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="table-empty-message">
                                        No hay unidades registradas.
                                    </td>
                                </tr>
                            ) : (
                                units.map((unit) => {
                                    const isSelected = selectedIds.includes(unit.id);
                                    return (
                                        <tr
                                            key={unit.id}
                                            className={`table-row ${isSelected ? 'selected' : ''}`}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(unit.id)}
                                                    className="cell-checkbox"
                                                />
                                            </td>
                                            <td className="cell-name">{unit.name}</td>
                                            <td className="cell-description">{unit.abbreviation || '-'}</td>
                                            <td>
                                                {unit.is_composite ? (
                                                    <span className="badge-composite">
                                                        Contenedor
                                                    </span>
                                                ) : (
                                                    <span className="badge-simple">Simple</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingUnit(unit)}
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => setDeleteId(unit.id)}
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
                    <div className="form-input-group large">
                        <Input
                            label="Nombre (Ej. Paquete)"
                            placeholder="Nueva unidad..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-input-group">
                        <Input
                            label="Abreviatura (Ej. paq)"
                            placeholder="Abrev..."
                            value={newAbbrev}
                            onChange={e => setNewAbbrev(e.target.value)}
                        />
                    </div>
                    <div className="form-checkbox-group">
                        <div className="checkbox-wrapper">
                            <input
                                type="checkbox"
                                id="newIsComposite"
                                checked={newIsComposite}
                                onChange={e => setNewIsComposite(e.target.checked)}
                                className="checkbox-input"
                            />
                            <label htmlFor="newIsComposite" className="checkbox-label">
                                ¿Es contenido? <br />
                                <span className="checkbox-hint">(Ej. Caja, Paquete)</span>
                            </label>
                        </div>
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
                isOpen={!!editingUnit}
                onClose={() => setEditingUnit(null)}
                title="Editar Unidad"
            >
                {editingUnit && (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <Input
                            label="Nombre"
                            value={editingUnit.name}
                            onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Abreviatura"
                            value={editingUnit.abbreviation || ''}
                            onChange={e => setEditingUnit({ ...editingUnit, abbreviation: e.target.value })}
                        />
                        <div className="checkbox-wrapper">
                            <input
                                type="checkbox"
                                id="editIsComposite"
                                checked={editingUnit.is_composite || false}
                                onChange={e => setEditingUnit({ ...editingUnit, is_composite: e.target.checked })}
                                className="checkbox-input"
                            />
                            <label htmlFor="editIsComposite" className="checkbox-label">
                                ¿Es contenido? (Caja, Paquete, etc.)
                            </label>
                        </div>
                        <div className="modal-actions">
                            <Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>
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
                title={deleteId === 'bulk_action_placeholder' ? 'Eliminar Seleccionados' : 'Eliminar Unidad'}
                message={deleteId === 'bulk_action_placeholder'
                    ? `¿Estás seguro de que deseas eliminar las ${selectedIds.length} unidades seleccionadas?`
                    : "¿Estás seguro de que deseas eliminar esta unidad?"
                }
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                confirmText="Sí, eliminar"
            />
        </div >
    );
};
