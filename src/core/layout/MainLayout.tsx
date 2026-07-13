import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, Store, Menu, Truck, ShoppingBag, ChevronDown, ArrowRightLeft, Users, CreditCard, Bell } from 'lucide-react';
import './MainLayout.css';

import { useStores } from '../../modules/settings/hooks/useStores';
import { useNotifications } from '../../modules/notifications/hooks/useNotifications';

export const MainLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(true);
    const { stores, activeStoreId, setActiveStore } = useStores();
    const { getUnreadCount } = useNotifications();
    const unreadCount = getUnreadCount(activeStoreId);
    const location = useLocation();
    const isFormActive = location.pathname.includes('/new') || location.pathname.includes('/edit');
    const [isFlashing, setIsFlashing] = React.useState(false);

    React.useEffect(() => {
        if (sessionStorage.getItem('flash_on_load') === 'true') {
            sessionStorage.removeItem('flash_on_load');
            setIsFlashing(true);
        }
    }, []);

    React.useEffect(() => {
        if (isFlashing) {
            const timer = setTimeout(() => setIsFlashing(false), 800);
            return () => clearTimeout(timer);
        }
    }, [isFlashing]);
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

                    <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <CreditCard size={20} />
                        <span>Ventas</span>
                    </NavLink>

                    <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}>
                        <Bell size={20} color={unreadCount > 0 ? 'var(--error)' : 'currentColor'} />
                        <span>Notificaciones</span>
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
                                    key={stores.map(s => `${s.id}-${s.name}-${s.isDefault}`).join(',')}
                                    value={activeStoreId}
                                    onChange={(e) => {
                                        setActiveStore(e.target.value);
                                        sessionStorage.setItem('flash_on_load', 'true');
                                        const path = window.location.pathname;
                                        if (path.includes('/transfers/new') || path.includes('/transfers/edit')) {
                                            window.location.href = '/transfers';
                                        } else if (path.includes('/purchases/new') || path.includes('/purchases/edit')) {
                                            window.location.href = '/purchases';
                                        } else {
                                            window.location.reload();
                                        }
                                    }}
                                    className="store-selector"
                                    title={isFormActive ? "No puedes cambiar de tienda mientras editas un formulario" : "Cambiar Tienda Activa"}
                                    disabled={isFormActive}
                                    style={{ opacity: isFormActive ? 0.6 : 1, cursor: isFormActive ? 'not-allowed' : 'pointer' }}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <NavLink to="/notifications" style={{ position: 'relative', color: unreadCount > 0 ? 'var(--error)' : 'var(--muted-foreground)', textDecoration: 'none' }} className={({ isActive }) => isActive ? 'text-primary' : ''}>
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    backgroundColor: 'var(--error)',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--surface)'
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </NavLink>

                        <div className="user-profile">
                            <div className="avatar">A</div>
                            <span>Admin</span>
                        </div>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet context={{ activeStoreId }} />
                </div>
            </main>

            {/* Store change flash overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isFlashing ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                    pointerEvents: 'none',
                    transition: 'background-color 0.8s ease-out',
                    zIndex: 9999
                }}
            />
        </div>
    );
};
