import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TransferForm } from './components/TransferForm';
import { useTransfers } from './hooks/useTransfers';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { ArrowLeft } from 'lucide-react';
import type { Transfer } from './types';

export const TransferEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { transfers, updateTransfer } = useTransfers();
    const { addStockToStore } = useInventory();

    const [originalTransfer, setOriginalTransfer] = useState<Transfer | null>(null);

    useEffect(() => {
        if (id && transfers.length > 0) {
            const found = transfers.find(t => t.id === id);
            if (found) {
                setOriginalTransfer(found);
            } else {
                navigate('/transfers');
            }
        }
    }, [id, transfers, navigate]);

    const handleEdit = async (updatedData: Omit<Transfer, 'id' | 'createdAt' | 'status'>) => {
        if (!originalTransfer) return;

        // 1. Revert Original Stock (Logic from Revert Action)
        // Original: -Source, +Dest
        // Revert: +Source, -Dest
        originalTransfer.items.forEach(item => {
            // Add back to source
            addStockToStore(item.productId, originalTransfer.sourceStoreId, item.quantity);
            // Remove from destination
            addStockToStore(item.productId, originalTransfer.destinationStoreId, -item.quantity);
        });

        // 2. Apply New Stock
        // New: -Source, +Dest
        updatedData.items.forEach(item => {
            // Subtract from NEW source
            addStockToStore(item.productId, updatedData.sourceStoreId, -item.quantity);
            // Add to NEW destination
            addStockToStore(item.productId, updatedData.destinationStoreId, item.quantity);
        });

        // 3. Update Record
        updateTransfer(originalTransfer.id, {
            ...updatedData,
            status: 'completed'
        });

        navigate('/transfers');
    };

    if (!originalTransfer) {
        return <div className="p-8">Cargando...</div>;
    }

    return (
        <div className="animate-in h-100 flex flex-col gap-4 p-6 pt-0" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', paddingTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" onClick={() => navigate('/transfers')} icon={<ArrowLeft size={20} />}>
                    Volver
                </Button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Editar Transferencia</h1>
                    <p className="text-muted">Modifica los detalles de la transferencia ID: {originalTransfer.id.slice(0, 8)}</p>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <TransferForm
                    initialData={originalTransfer}
                    onSubmit={handleEdit}
                    onCancel={() => navigate('/transfers')}
                />
            </div>
        </div>
    );
};
