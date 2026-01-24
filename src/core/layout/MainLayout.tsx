import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, Store, Menu, Truck, ShoppingBag, ChevronDown, ArrowRightLeft, Users } from 'lucide-react';
import './MainLayout.css';

import { useStores } from '../../modules/settings/hooks/useStores';

export const MainLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(true);
    const { stores, activeStoreId, setActiveStore } = useStores();



    return (
        <div className="layout-container">
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="brand-info">
                        <Store className="brand-icon" size={28} />
                        <h1 className="brand-title">Papelería Pro</h1>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Package size={20} />
                        <span>Inventario</span>
                    </NavLink>

                    <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Truck size={20} />
                        <span>Proveedores</span>
                    </NavLink>

                    <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>Clientes</span>
                    </NavLink>

                    <NavLink to="/purchases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingBag size={20} />
                        <span>Compras</span>
                    </NavLink>

                    <NavLink to="/transfers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ArrowRightLeft size={20} />
                        <span>Transferencias</span>
                    </NavLink>

                    <NavLink to="/pos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={20} />
                        <span>Punto de Venta</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Settings size={20} />
                        <span>Configuración</span>
                    </NavLink>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-section">
                        <h2 className="page-title">Bienvenido</h2>

                        <div className="store-selector-container">
                            <Store size={16} className="text-muted" />
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <select
                                    value={activeStoreId}
                                    onChange={(e) => setActiveStore(e.target.value)}
                                    className="store-selector"
                                    title="Cambiar Tienda Activa"
                                >
                                    {stores.map(store => (
                                        <option key={store.id} value={store.id}>
                                            {store.name} {store.isDefault ? '(Principal)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="text-muted" style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
                            </div>
                        </div>
                    </div>

                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <span>Admin</span>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet context={{ activeStoreId }} />
                </div>
            </main>
        </div>
    );
};
