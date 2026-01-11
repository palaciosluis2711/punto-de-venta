import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TransferForm } from './components/TransferForm';
import { useTransfers } from './hooks/useTransfers';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { ArrowLeft } from 'lucide-react';


export const TransferCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addTransfer } = useTransfers();
    // Destructure updateStockBulk
    const { updateStockBulk } = useInventory();

    const handleCreate = async (data: any) => {
        // 1. Update Inventory Stock (Atomic Bulk Update)
        if (data.items && Array.isArray(data.items)) {
            console.log("Processing Transfer Items:", data.items);
            const movements: any[] = [];

            // Subtract from Source
            data.items.forEach((item: any) => {
                const qty = Number(item.quantity);
                movements.push({
                    productId: item.productId,
                    storeId: data.sourceStoreId,
                    quantity: -qty
                });
            });

            // Add to Destination
            data.items.forEach((item: any) => {
                const qty = Number(item.quantity);
                movements.push({
                    productId: item.productId,
                    storeId: data.destinationStoreId,
                    quantity: qty
                });
            });

            console.log("Sending Bulk Movements:", movements);
            updateStockBulk(movements);
        }

        // 2. Create Record
        addTransfer({
            ...data,
            status: 'completed'
        });

        navigate('/transfers');
    };

    return (
        <div className="animate-in h-100 flex flex-col gap-4 p-6 pt-0" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', paddingTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" onClick={() => navigate('/transfers')} icon={<ArrowLeft size={20} />}>
                    Volver
                </Button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Nueva Transferencia</h1>
                    <p className="text-muted">Mueve productos entre tiendas.</p>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <TransferForm
                    onSubmit={handleCreate}
                    onCancel={() => navigate('/transfers')}
                />
            </div>
        </div>
    );
};
