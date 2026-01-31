import React, { useState } from 'react';
import { usePaymentMethods, type PaymentMethod } from '../hooks/usePaymentMethods';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Plus, Trash2, CreditCard, Edit, Save } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import './UnitsSettings.css'; // Reusing existing settings styles

export const PaymentMethodsSettings: React.FC = () => {
    const { paymentMethods, addMethod, updateMethod, deleteMethod } = usePaymentMethods();

    // Add State
    const [newName, setNewName] = useState('');

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Edit State
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addMethod(newName.trim());
            setNewName('');
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMethod && editingMethod.name.trim()) {
            updateMethod(editingMethod.id, editingMethod.name.trim());
            setEditingMethod(null);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Métodos de Pago</h2>
                            <p className="header-subtitle">Configura los métodos de pago aceptados en el POS.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-content-wrapper">
                <div className="table-wrapper">
                    <table className="settings-table">
                        <thead className="settings-table-header">
                            <tr>
                                <th className="th-text">Nombre</th>
                                <th className="th-text th-actions">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentMethods.map((method) => (
                                <tr key={method.id} className="table-row">
                                    <td className="cell-name">{method.name}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingMethod(method)}
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            {!method.isDefault && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-danger"
                                                    onClick={() => setDeleteId(method.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <form onSubmit={handleAdd} className="settings-form">
                    <div className="form-input-group large">
                        <Input
                            label="Nuevo Método de Pago"
                            placeholder="Ej. Cheque, Bitcoin..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
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
                isOpen={!!editingMethod}
                onClose={() => setEditingMethod(null)}
                title="Editar Método de Pago"
            >
                {editingMethod && (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <Input
                            label="Nombre"
                            value={editingMethod.name}
                            onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                            required
                        />
                        <div className="modal-actions">
                            <Button type="button" variant="outline" onClick={() => setEditingMethod(null)}>
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
                title="Eliminar Método de Pago"
                message="¿Estás seguro de que deseas eliminar este método de pago?"
                onConfirm={() => {
                    if (deleteId) {
                        deleteMethod(deleteId);
                        setDeleteId(null);
                    }
                }}
                onCancel={() => setDeleteId(null)}
                confirmText="Sí, eliminar"
            />
        </div>
    );
};
