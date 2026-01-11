import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseForm } from './components/PurchaseForm';
import { usePurchases } from './hooks/usePurchases';
import { useInventory } from '../inventory/hooks/useInventory';
import { Button } from '../../shared/components/Button';
import { ArrowLeft } from 'lucide-react';
import type { Purchase } from './types';

export const PurchaseEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { purchases, updatePurchase } = usePurchases();
    const { addStockToStore } = useInventory();

    // We need the original purchase to revert its effects
    const [originalPurchase, setOriginalPurchase] = useState<Purchase | null>(null);

    useEffect(() => {
        if (id && purchases.length > 0) {
            const found = purchases.find(p => p.id === id);
            if (found) {
                setOriginalPurchase(found);
            } else {
                // Handle not found
                navigate('/purchases');
            }
        }
    }, [id, purchases, navigate]);

    const handleEdit = async (updatedData: Omit<Purchase, 'id' | 'createdAt' | 'status'>) => {
        if (!originalPurchase) return;

        // 1. Revert Original Stock (Logic from Revert Action)
        // We iterate and subtract the stock we previously added.
        // HOWEVER, "addStockToStore" adds positive numbers. 
        // When we bought, we *added* positive stock.
        // To revert, we must *add* negative stock (subtract).
        originalPurchase.items.forEach(item => {
            addStockToStore(item.productId, originalPurchase.storeId, -item.quantity);
        });

        // 2. Apply New Stock
        // Now adding the NEW items as if they were a fresh purchase
        updatedData.items.forEach(item => {
            addStockToStore(item.productId, updatedData.storeId, item.quantity);
        });

        // 3. Update Purchase Record
        updatePurchase(originalPurchase.id, {
            ...updatedData,
            status: 'completed' // Ensure it's active if it was cancelled, or keep active
        });

        navigate('/purchases');
    };

    if (!originalPurchase) {
        return <div className="p-8">Cargando...</div>;
    }

    return (
        <div className="animate-in h-100 flex flex-col gap-4 p-6 pt-0" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', paddingTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" onClick={() => navigate('/purchases')} icon={<ArrowLeft size={20} />}>
                    Volver
                </Button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Editar Compra</h1>
                    <p className="text-muted">Modifica los detalles de la orden ID: {originalPurchase.id.slice(0, 8)}</p>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {/* 
                  The PurchaseForm expects "Omit<Purchase, 'id'>" for submission.
                  The "status" and "createdAt" are managed by logic, but we need to pass strict types.
                  Our 'updatedData' in handleEdit matches what the Form produces.
                 */}
                <PurchaseForm
                    initialData={originalPurchase}
                    onSubmit={handleEdit}
                    onCancel={() => navigate('/purchases')}
                />
            </div>
        </div>
    );
};
