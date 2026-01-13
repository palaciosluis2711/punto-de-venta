import React, { useState } from 'react';
import { Plus, Search, Trash2, Copy, Check } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { useStores } from '../settings/hooks/useStores';
import { ProductTable } from './components/ProductTable';
import { ProductForm } from './components/ProductForm';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import type { Product } from './types';

export const InventoryPage: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct, deleteProductsBulk, searchProducts } = useInventory();
    const { stores } = useStores();
    const [copiedBarcode, setCopiedBarcode] = useState(false);

    const handleCopyBarcode = () => {
        if (viewingProduct?.barcode) {
            navigator.clipboard.writeText(viewingProduct.barcode);
            setCopiedBarcode(true);
            setTimeout(() => setCopiedBarcode(false), 2000);
        }
    };
    const [isModalOpen, setIsModalOpen] = useState(() => {
        return localStorage.getItem('app_inventory_new_product_open') === 'true';
    });
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'single' | 'bulk';
        id?: string;
    }>({ isOpen: false, type: 'single' });

    const [viewingProduct, setViewingProduct] = useState<Product | undefined>(undefined);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const filteredProducts = searchQuery ? searchProducts(searchQuery) : products;

    const handleAddClick = () => {
        setEditingProduct(undefined);
        setIsModalOpen(true);
        localStorage.setItem('app_inventory_new_product_open', 'true');
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
        // We don't persist Edit mode for now, so treat as 'false' for new product persistence
        localStorage.setItem('app_inventory_new_product_open', 'false');
    };

    const handleViewClick = (product: Product) => {
        setViewingProduct(product);
        setIsDetailsOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDialog({ isOpen: true, type: 'single', id });
    };

    const handleBulkDelete = () => {
        setConfirmDialog({ isOpen: true, type: 'bulk' });
    };

    const confirmDelete = () => {
        if (confirmDialog.type === 'single' && confirmDialog.id) {
            deleteProduct(confirmDialog.id);
            setSelectedIds(prev => prev.filter(pid => pid !== confirmDialog.id));
        } else if (confirmDialog.type === 'bulk') {
            deleteProductsBulk(selectedIds);
            setSelectedIds([]);
        }
        setConfirmDialog({ isOpen: false, type: 'single' });
    };

    const handleFormSubmit = (data: Omit<Product, 'id'>) => {
        if (editingProduct) {
            updateProduct(editingProduct.id, data);
        } else {
            addProduct(data);
        }
        setIsModalOpen(false);
        localStorage.setItem('app_inventory_new_product_open', 'false');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        localStorage.setItem('app_inventory_new_product_open', 'false');
    };


    return (
        <React.Fragment>
            <div className="animate-in flex gap-6" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', height: '100%' }}>
                <div className="flex flex-col gap-6" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Inventario</h1>
                            <p className="text-muted">Gestiona tus productos y existencias.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {selectedIds.length > 0 && (
                                <Button
                                    variant="primary"
                                    className="bg-danger text-white hover:bg-red-600"
                                    style={{ backgroundColor: 'var(--error)' }}
                                    onClick={handleBulkDelete}
                                    icon={<Trash2 size={20} />}
                                >
                                    Eliminar ({selectedIds.length})
                                </Button>
                            )}
                            {!isModalOpen && (
                                <Button onClick={handleAddClick} icon={<Plus size={20} />}>
                                    Nuevo Producto
                                </Button>
                            )}
                        </div>
                    </div>

                    <div style={{ maxWidth: '400px', flexShrink: 0 }}>
                        <Input
                            placeholder="Buscar por nombre o código..."
                            icon={<Search size={18} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <ProductTable
                            products={filteredProducts}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            onView={handleViewClick}
                        />
                    </div>
                </div>

                {/* Side Panel for Form */}
                <div
                    className={`animate-in slide-in-from-right-4 fade-in`}
                    style={{
                        width: isModalOpen ? '450px' : '0',
                        opacity: isModalOpen ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: 'var(--surface)',
                        borderLeft: '1px solid var(--border)',
                        height: '100%',
                        position: 'sticky',
                        top: '0',
                        display: isModalOpen ? 'block' : 'none',
                        boxShadow: '-10px 0 30px -10px rgba(0,0,0,0.1)',
                        borderRadius: 'var(--radius-lg)',
                        marginRight: '-1.5rem'
                    }}
                >
                    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                                Cerrar
                            </Button>
                        </div>
                        <ProductForm
                            initialData={editingProduct}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseModal}
                        />
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title="Detalles del Producto"
            >
                {viewingProduct && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: 'var(--radius-lg)',
                                backgroundColor: 'var(--surface-hover)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                {viewingProduct.image ? (
                                    <img src={viewingProduct.image} alt={viewingProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="text-muted flex flex-col items-center gap-1">
                                        <span style={{ fontSize: '0.75rem' }}>Sin imagen</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{viewingProduct.name}</h3>
                                <span className="badge" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{viewingProduct.category}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Código de Barras</label>
                                <div
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={handleCopyBarcode}
                                    title="Copiar código de barras"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                >
                                    <p style={{ fontFamily: 'monospace', fontSize: '1.1rem' }} className="group-hover:text-primary transition-colors">
                                        {viewingProduct.barcode}
                                    </p>
                                    <Button variant="ghost" size="sm" style={{ padding: '4px', height: 'auto' }}>
                                        {copiedBarcode ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted hover:text-primary" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Marca</label>
                                <p>{viewingProduct.brand || '-'}</p>
                            </div>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Precio Venta</label>
                                <p style={{ fontWeight: 600, color: 'var(--primary)' }}>${viewingProduct.price.toFixed(2)}</p>
                            </div>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Costo</label>
                                <p>${viewingProduct.cost.toFixed(2)}</p>
                            </div>
                            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                <label className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }}>Existencias por Tienda</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                    {stores.map(store => {
                                        const stock = viewingProduct.inventory?.[store.id] || 0;
                                        return (
                                            <div key={store.id} style={{
                                                padding: '0.5rem',
                                                backgroundColor: 'var(--background)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{store.name}</span>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: stock < (viewingProduct.minStock || 10) ? 'var(--danger)' : 'var(--text-main)'
                                                }}>
                                                    {stock}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Total Global: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{viewingProduct.stock}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <label className="text-muted" style={{ fontSize: '0.875rem' }}>Unidad</label>
                                <p>
                                    {viewingProduct.unit || 'Pieza'}
                                    {viewingProduct.items_per_unit ? ` (${viewingProduct.items_per_unit} u/c)` : ''}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'end' }}>
                            <Button onClick={() => setIsDetailsOpen(false)}>Cerrar</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.type === 'single' ? "Eliminar Producto" : "Eliminar Productos"}
                message={confirmDialog.type === 'single'
                    ? "¿Estás seguro de que deseas eliminar este producto?"
                    : `¿Estás seguro de que deseas eliminar los ${selectedIds.length} productos seleccionados?`
                }
                onConfirm={confirmDelete}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                confirmText="Sí, eliminar"
            />
        </React.Fragment>
    );
};
