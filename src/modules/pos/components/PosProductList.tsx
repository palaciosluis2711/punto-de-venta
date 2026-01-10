import React from 'react';
import type { Product } from '../../inventory/types';
import './PosProductList.css';

interface PosProductListProps {
    products: Product[];
    onAdd: (product: Product) => void;
}

export const PosProductList: React.FC<PosProductListProps> = ({ products, onAdd }) => {
    return (
        <div className="pos-grid">
            {products.map(product => (
                <div key={product.id} className="pos-card" onClick={() => onAdd(product)}>
                    <div className="pos-card-content">
                        <h3 className="pos-product-name">{product.name}</h3>
                        <span className="pos-product-cat">{product.category}</span>
                        <div className="pos-product-price">${product.price.toFixed(2)}</div>
                        <div className={`pos-product-stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                            Stock: {product.stock}
                        </div>
                    </div>
                </div>
            ))}
            {products.length === 0 && (
                <div className="text-muted col-span-full text-center">
                    No se encontraron productos.
                </div>
            )}
        </div>
    );
};
