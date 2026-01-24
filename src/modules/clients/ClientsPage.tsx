import React, { useState } from 'react';
import { useClients } from './hooks/useClients';
import { ClientTable } from './components/ClientTable';
import { ClientForm } from './components/ClientForm';
import { ClientDetails } from './components/ClientDetails';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { Plus, Search, Users } from 'lucide-react';
import type { Client } from './types';

export const ClientsPage: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient, searchClients } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [viewingClient, setViewingClient] = useState<Client | null>(null);

    const filteredClients = searchQuery ? searchClients(searchQuery) : clients;

    const handleAddClick = () => {
        setEditingClient(undefined);
        setIsFormOpen(true);
    };

    const handleEditClick = (client: Client) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleFormSubmit = (data: Omit<Client, 'id'>) => {
        if (editingClient) {
            updateClient(editingClient.id, data);
        } else {
            addClient(data);
        }
        setIsFormOpen(false);
    };

    return (
        <div className="flex flex-col gap-6 h-full overflow-hidden" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users className="text-primary" /> Clientes
                    </h1>
                    <p className="text-muted">Gestiona tu cartera de clientes.</p>
                </div>
                <Button onClick={handleAddClick} icon={<Plus size={20} />}>
                    Nuevo Cliente
                </Button>
            </div>

            <div style={{ maxWidth: '400px' }}>
                <Input
                    placeholder="Buscar por nombre, DUI, NIT..."
                    icon={<Search size={18} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    rightElement={searchQuery ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            style={{ padding: '0.25rem', height: 'auto', width: 'auto' }}
                            title="Limpiar búsqueda"
                        >
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>✕</span>
                        </Button>
                    ) : undefined}
                />
            </div>

            <ClientTable
                clients={filteredClients}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onView={setViewingClient}
            />

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            >
                <ClientForm
                    initialData={editingClient}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={!!viewingClient}
                onClose={() => setViewingClient(null)}
                title="Detalles del Cliente"
            >
                {viewingClient && (
                    <ClientDetails
                        client={viewingClient}
                        onClose={() => setViewingClient(null)}
                    />
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) deleteClient(deleteId);
                    setDeleteId(null);
                }}
                title="Eliminar Cliente"
                message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
            />
        </div>
    );
};
