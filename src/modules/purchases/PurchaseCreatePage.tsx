import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchases } from './hooks/usePurchases';
import { useInventory } from '../inventory/hooks/useInventory';
import { PurchaseForm } from './components/PurchaseForm';
import { Button } from '../../shared/components/Button';
import { ArrowLeft } from 'lucide-react';
import './PurchasesPage.css'; // Reuse existing styles

export const PurchaseCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addPurchase } = usePurchases();
    const { updateStockBulk } = useInventory();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreatePurchase = async (data: any) => {
        setIsProcessing(true);
        try {
            // 1. Save Purchase Record
            addPurchase(data);

            // 2. Update Inventory Stock
            if (data.items && Array.isArray(data.items)) {
                const movements = data.items.map((item: any) => ({
                    productId: item.productId,
                    storeId: data.storeId,
                    quantity: item.quantity
                }));
                updateStockBulk(movements);
            }

            // Return to list view
            navigate('/purchases');
        } catch (error) {
            console.error("Error creating purchase:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="purchases-page animate-in">
            <div className="purchases-header">
                <div>
                    <h1 className="purchases-title">
                        <Button variant="ghost" onClick={() => navigate('/purchases')} icon={<ArrowLeft size={20} />}>
                            Volver
                        </Button>
                        Registrar Nueva Compra
                    </h1>
                </div>
            </div>
            <div className="purchases-form-container" style={{ flex: 1, overflow: 'hidden' }}>
                <PurchaseForm
                    onSubmit={handleCreatePurchase}
                    onCancel={() => navigate('/purchases')}
                    isProcessing={isProcessing}
                />
            </div>
        </div>
    );
};
