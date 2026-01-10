import React from 'react';
import type { Product } from '../types';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import './ProductTable.css';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    onView?: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
    products,
    onEdit,
    onDelete,
    selectedIds = [],
    onSelectionChange,
    onView
}) => {
    const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));
    const isSelectionEnabled = !!onSelectionChange;

    const toggleAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(products.map(p => p.id));
        }
    };

    const toggleOne = (id: string) => {
        if (!onSelectionChange) return;
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(sid => sid !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    return (
        <div className="table-container">
            <table className="product-table">
                <thead>
                    <tr>
                        {isSelectionEnabled && (
                            <th style={{ width: '40px', paddingLeft: '1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                        )}
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>Categoría</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">Stock</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => {
                        const isSelected = selectedIds.includes(product.id);
                        return (
                            <tr
                                key={product.id}
                                className={isSelected ? 'selected-row' : ''}
                                onClick={() => onView && onView(product)}
                                style={{ cursor: onView ? 'pointer' : 'default' }}
                            >
                                {isSelectionEnabled && (
                                    <td style={{ paddingLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleOne(product.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </td>
                                )}
                                <td className="font-medium">{product.name}</td>
                                <td className="text-muted">{product.barcode}</td>
                                <td>
                                    <span className="badge">{product.category}</span>
                                </td>
                                <td className="text-right">${product.price.toFixed(2)}</td>
                                <td className="text-right">
                                    <span className={product.stock < 10 ? 'text-danger' : ''}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="text-center" onClick={e => e.stopPropagation()}>
                                    <div className="flex-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(product)}
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-danger"
                                            onClick={() => onDelete(product.id)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan={isSelectionEnabled ? 7 : 6} className="text-center py-8 text-muted">
                                No hay productos registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
