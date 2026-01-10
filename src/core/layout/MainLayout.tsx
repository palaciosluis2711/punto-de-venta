import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, Store, Menu, Truck } from 'lucide-react';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(true);

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
                    <h2 className="page-title">Bienvenido</h2>
                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <span>Admin</span>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
