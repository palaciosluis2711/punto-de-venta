import React, { useMemo, useState } from 'react';
import { useSales } from '../sales/hooks/useSales';
import { useInventory } from '../inventory/hooks/useInventory';
import { useClients } from '../clients/hooks/useClients';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Package, Users, TrendingUp, AlertTriangle, Clock, ChevronDown, ChevronUp, Award, Store, PieChart as PieChartIcon } from 'lucide-react';
import './DashboardPage.css'; // Let's add a CSS file for styling
import { Button } from '../../shared/components/Button';
import { ProductRequestModal, type RequestItem } from '../inventory/components/ProductRequestModal';
import { useStores } from '../settings/hooks/useStores';
import { useNotifications } from '../notifications/hooks/useNotifications';
import { useToast } from '../../shared/components/Toast/useToast';
import { CustomSelect } from '../../shared/components/CustomSelect';

export const DashboardPage: React.FC = () => {
    const { sales } = useSales();
    const { products } = useInventory();
    const { clients } = useClients();
    const { activeStoreId, stores } = useStores();
    const { addNotification } = useNotifications();
    const { showToast } = useToast();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [highlightRequestBtn, setHighlightRequestBtn] = useState(false);
    const [isSalesExpanded, setIsSalesExpanded] = useState(() => localStorage.getItem('dashboard_sales_expanded') === 'true');
    const [isStockExpanded, setIsStockExpanded] = useState(() => localStorage.getItem('dashboard_stock_expanded') === 'true');
    const [isClientsExpanded, setIsClientsExpanded] = useState(() => localStorage.getItem('dashboard_clients_expanded') === 'true');
    const [isTopProductsExpanded, setIsTopProductsExpanded] = useState(() => localStorage.getItem('dashboard_top_products_expanded') === 'true');
    const [isInvestmentExpanded, setIsInvestmentExpanded] = useState(() => {
        const stored = localStorage.getItem('dashboard_investment_expanded');
        return stored !== null ? stored === 'true' : true;
    });

    const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>(() => {
        return (localStorage.getItem('dashboard_time_filter') as any) || 'month';
    });
    const [storeFilter, setStoreFilter] = useState<string>(() => {
        return localStorage.getItem('dashboard_store_filter') || 'all';
    });

    React.useEffect(() => {
        localStorage.setItem('dashboard_sales_expanded', String(isSalesExpanded));
        localStorage.setItem('dashboard_stock_expanded', String(isStockExpanded));
        localStorage.setItem('dashboard_clients_expanded', String(isClientsExpanded));
        localStorage.setItem('dashboard_top_products_expanded', String(isTopProductsExpanded));
        localStorage.setItem('dashboard_investment_expanded', String(isInvestmentExpanded));
        localStorage.setItem('dashboard_time_filter', timeFilter);
        localStorage.setItem('dashboard_store_filter', storeFilter);
    }, [isSalesExpanded, isStockExpanded, isClientsExpanded, isTopProductsExpanded, isInvestmentExpanded, timeFilter, storeFilter]);


    const scrollToBottomDuringExpand = (elementId: string) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startTime = performance.now();
        const duration = 320; // slightly longer than CSS transition to ensure final catch-up

        const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            el.scrollIntoView({ behavior: 'auto', block: 'end' });
            if (elapsed < duration) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    };

    const handleCriticalStockClick = () => {
        setIsStockExpanded(true);
        // Small timeout to allow React to render the class change
        setTimeout(() => {
            scrollToBottomDuringExpand('critical-stock-list');
            setHighlightRequestBtn(true);
            setTimeout(() => setHighlightRequestBtn(false), 3000);
        }, 10);
    };

    const handleSalesClick = () => {
        setIsSalesExpanded(true);
        setTimeout(() => {
            scrollToBottomDuringExpand('recent-sales-list');
        }, 10);
    };

    const handleClientsClick = () => {
        setIsClientsExpanded(true);
        setTimeout(() => {
            scrollToBottomDuringExpand('latest-clients-list');
        }, 10);
    };

    const handleProductRequestSubmit = (targetStoreId: string, items: RequestItem[], notes: string) => {
        addNotification({
            title: 'Nueva Solicitud de Productos',
            message: `La tienda ${stores.find(s => s.id === activeStoreId)?.name || 'Principal'} ha solicitado ${items.length} productos diferentes. Notas: ${notes}`,
            sourceStoreId: activeStoreId,
            targetStoreId,
            priority: 'high',
            type: 'request',
            payload: { items, status: 'pending', notes }
        });
        showToast('Solicitud enviada con éxito', 'success');
        setIsRequestModalOpen(false);
    };


    // -- CALCULATIONS -- //
    const now = new Date();

    // Start Date based on timeFilter
    const startDate = useMemo(() => {
        if (timeFilter === 'all') return null;

        const d = new Date();
        d.setHours(0, 0, 0, 0);

        if (timeFilter === 'day') {
            return d;
        } else if (timeFilter === 'week') {
            const day = d.getDay() || 7;
            d.setDate(d.getDate() - day + 1);
            return d;
        } else if (timeFilter === 'month') {
            d.setDate(1);
            return d;
        } else if (timeFilter === 'year') {
            d.setMonth(0, 1);
            return d;
        }
        return null;
    }, [timeFilter]);

    // Filter Sales
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            if (storeFilter !== 'all' && sale.storeId !== storeFilter) return false;
            if (startDate) {
                const saleDate = new Date(sale.date);
                if (saleDate < startDate) return false;
            }
            return true;
        });
    }, [sales, storeFilter, startDate]);

    // Filter Clients
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            if (storeFilter !== 'all' && client.storeId && client.storeId !== storeFilter) return false;
            if (startDate && client.createdAt) {
                const clientDate = new Date(client.createdAt);
                if (clientDate < startDate) return false;
            }
            return true;
        });
    }, [clients, storeFilter, startDate]);

    // 1. Sales & Profit
    const { totalRevenue, estimatedProfit } = useMemo(() => {
        let rev = 0;
        let cost = 0;
        filteredSales.forEach(sale => {
            rev += sale.total;
            sale.items.forEach(item => {
                const itemCost = item.unitCost ?? (products.find(p => p.id === item.productId)?.cost || 0);
                cost += (itemCost * item.quantity);
            });
        });
        return { totalRevenue: rev, estimatedProfit: rev - cost };
    }, [filteredSales, products]);

    // 2. Critical Stock
    const criticalProducts = useMemo(() => {
        return products.filter(p => {
            const stock = storeFilter === 'all' ? p.stock : (p.inventory?.[storeFilter] || 0);
            return stock <= (p.minStock || 5);
        }).map(p => ({
            ...p,
            stock: storeFilter === 'all' ? p.stock : (p.inventory?.[storeFilter] || 0)
        })).sort((a, b) => a.stock - b.stock);
    }, [products, storeFilter]);

    // 3. Chart Data (Dynamic)
    const chartData = useMemo(() => {
        const dataMap: Record<string, { ingresos: number, ganancia: number }> = {};

        // Initialize bins based on timeFilter
        if (timeFilter === 'day') {
            for (let i = 0; i < 24; i++) {
                dataMap[`${i.toString().padStart(2, '0')}:00`] = { ingresos: 0, ganancia: 0 };
            }
        } else if (timeFilter === 'week' || timeFilter === 'month') {
            const days = timeFilter === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const startD = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
            for (let i = 0; i < days; i++) {
                const d = new Date(startD.getTime() + (i * 24 * 60 * 60 * 1000));
                if (d > now) break;
                const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                dataMap[dateStr] = { ingresos: 0, ganancia: 0 };
            }
        } else if (timeFilter === 'year' || timeFilter === 'all') {
            for (let i = 0; i < 12; i++) {
                const dateStr = `${(i + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                dataMap[dateStr] = { ingresos: 0, ganancia: 0 };
            }
        }

        filteredSales.forEach(sale => {
            const saleDate = new Date(sale.date);
            let key = '';

            if (timeFilter === 'day') {
                key = `${saleDate.getHours().toString().padStart(2, '0')}:00`;
            } else if (timeFilter === 'week' || timeFilter === 'month') {
                key = `${saleDate.getDate().toString().padStart(2, '0')}/${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
            } else if (timeFilter === 'year' || timeFilter === 'all') {
                key = `${(saleDate.getMonth() + 1).toString().padStart(2, '0')}/${saleDate.getFullYear()}`;
            }

            if (!dataMap[key] && (timeFilter === 'all')) {
                dataMap[key] = { ingresos: 0, ganancia: 0 };
            }

            if (dataMap[key]) {
                dataMap[key].ingresos += sale.total;
                const cost = sale.items.reduce((acc, item) => {
                    const itemCost = item.unitCost ?? (products.find(p => p.id === item.productId)?.cost || 0);
                    return acc + (itemCost * item.quantity);
                }, 0);
                dataMap[key].ganancia += (sale.total - cost);
            }
        });

        return Object.keys(dataMap).map(key => ({
            name: key,
            ...dataMap[key]
        }));
    }, [filteredSales, products, timeFilter, startDate]);

    // 4. Latest 5 Sales
    const latestSales = useMemo(() => {
        return [...filteredSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [filteredSales]);

    // 5. Top 5 Products
    const topProducts = useMemo(() => {
        const productSales: Record<string, number> = {};
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                if (productSales[item.productId]) {
                    productSales[item.productId] += item.quantity;
                } else {
                    productSales[item.productId] = item.quantity;
                }
            });
        });

        return Object.keys(productSales)
            .map(id => ({
                product: products.find(p => p.id === id),
                count: productSales[id]
            }))
            .filter(item => item.product !== undefined)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) as { product: NonNullable<typeof products[0]>, count: number }[];
    }, [filteredSales, products]);

    // 6. Latest 5 Clients
    const latestClients = useMemo(() => {
        return [...filteredClients].reverse().slice(0, 5);
    }, [filteredClients]);

    // 7. Investment Data
    const investmentData = useMemo(() => {
        let totalCost = 0;
        let totalProfit = 0;
        products.forEach(p => {
            const stock = storeFilter === 'all' ? p.stock : (p.inventory?.[storeFilter] || 0);
            if (stock > 0) {
                totalCost += (p.cost || 0) * stock;
                totalProfit += ((p.price || 0) - (p.cost || 0)) * stock;
            }
        });

        return [
            { name: 'Inversión (Costo)', value: totalCost },
            { name: 'Ganancia Proyectada', value: totalProfit }
        ];
    }, [products, storeFilter]);

    const getChartTitle = () => {
        if (timeFilter === 'day') return "Tendencia de Ventas (Hoy)";
        if (timeFilter === 'week') return "Tendencia de Ventas (Esta semana)";
        if (timeFilter === 'month') return "Tendencia de Ventas (Este mes)";
        if (timeFilter === 'year') return "Tendencia de Ventas (Este año)";
        return "Tendencia de Ventas (Histórico)";
    };

    return (

        <div className="dashboard-page animate-in fade-in zoom-in-95 duration-500">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Panel de Control</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Resumen de actividad y métricas del negocio.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PERÍODO</label>
                        <CustomSelect
                            value={timeFilter}
                            onChange={(e: any) => {
                                const val = e?.target?.value !== undefined ? e.target.value : e;
                                setTimeFilter(val as any);
                            }}
                            icon={<Clock size={16} />}
                            minWidth="150px"
                            options={[
                                { value: 'day', label: 'Hoy' },
                                { value: 'week', label: 'Esta Semana' },
                                { value: 'month', label: 'Este Mes' },
                                { value: 'year', label: 'Este Año' },
                                { value: 'all', label: 'Todos' }
                            ]}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TIENDA</label>
                        <CustomSelect
                            value={storeFilter}
                            onChange={(e: any) => {
                                const val = e?.target?.value !== undefined ? e.target.value : e;
                                setStoreFilter(val);
                            }}
                            icon={<Store size={16} />}
                            minWidth="180px"
                            options={[
                                { value: 'all', label: 'Todas las Tiendas' },
                                ...stores.map(s => ({ value: s.id, label: s.name }))
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* -- METRICS CARDS -- */}
            <div className="dashboard-grid metrics-grid" style={{ paddingTop: '2rem' }}>
                <div
                    className="dashboard-card metric-card"
                    style={{ cursor: 'pointer' }}
                    onClick={handleSalesClick}
                    title="Ver últimas ventas"
                >
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="metric-info">
                        <p className="metric-title">Ingresos Totales</p>
                        <h3 className="metric-value">${totalRevenue.toFixed(2)}</h3>
                    </div>
                </div>

                <div
                    className="dashboard-card metric-card"
                    style={{ cursor: 'pointer' }}
                    onClick={handleSalesClick}
                    title="Ver últimas ventas"
                >
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="metric-info">
                        <p className="metric-title">Ganancia Estimada</p>
                        <h3 className="metric-value">${estimatedProfit.toFixed(2)}</h3>
                    </div>
                </div>

                <div
                    className="dashboard-card metric-card"
                    style={{ cursor: 'pointer' }}
                    onClick={handleCriticalStockClick}
                    title="Ver detalles de stock crítico"
                >
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="metric-info">
                        <p className="metric-title">Stock Crítico</p>
                        <h3 className="metric-value">{criticalProducts.length} <span className="text-sm font-normal text-muted">prods.</span></h3>
                    </div>
                </div>

                <div
                    className="dashboard-card metric-card"
                    style={{ cursor: 'pointer' }}
                    onClick={handleClientsClick}
                    title="Ver últimos clientes"
                >
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Users size={24} />
                    </div>
                    <div className="metric-info">
                        <p className="metric-title">Clientes Registrados</p>
                        <h3 className="metric-value">{clients.length}</h3>
                    </div>
                </div>
            </div>

            {/* -- CHART SECTION -- */}
            <div className="dashboard-card chart-card" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div className="card-header">
                    <h3 className="card-title">{getChartTitle()}</h3>
                </div>
                <div className="chart-container" style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
                                itemStyle={{ fontWeight: 500 }}
                                formatter={(value: any) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, '']}
                            />
                            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={2} />
                            <Area type="monotone" dataKey="ganancia" name="Ganancia" stroke="#10b981" fillOpacity={1} fill="url(#colorGanancia)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* -- BOTTOM GRIDS -- */}
            <div className="dashboard-grid split-grid">
                {/* --- COL 1 --- */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {/* Recent Sales */}
                    <div id="recent-sales-list" className="dashboard-card list-card" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                        <div
                            className="card-header border-b border-[var(--border)] pb-3 flex justify-between items-center"
                            style={{ paddingBottom: '0rem', cursor: 'pointer' }}
                            onClick={() => {
                                const nextState = !isSalesExpanded;
                                setIsSalesExpanded(nextState);
                                if (nextState) {
                                    setTimeout(() => scrollToBottomDuringExpand('recent-sales-list'), 10);
                                }
                            }}
                            title={isSalesExpanded ? "Ocultar ventas" : "Mostrar ventas"}
                        >
                            <h3 className="card-title flex items-center gap-2" style={{ margin: 0 }}>
                                <Clock size={18} />
                                <span>
                                    Últimas Ventas
                                    {!isSalesExpanded && latestSales.length > 0 && (
                                        <span className="font-normal text-sm" style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                            (${latestSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)})
                                        </span>
                                    )}
                                </span>
                            </h3>
                            <div style={{ color: 'var(--text-muted)' }}>
                                {isSalesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                        <div className={`accordion-wrapper ${isSalesExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                                <div className="list-content mt-3">
                                    {latestSales.length === 0 ? (
                                        <p className="text-muted text-sm text-center py-4">No hay ventas registradas.</p>
                                    ) : (
                                        <div className="list-content" style={{ paddingTop: '1rem' }}>
                                            {latestSales.map(sale => (
                                                <div key={sale.id} className="list-item-card">
                                                    <div className="list-item-left">
                                                        <div className="list-item-avatar avatar-blue">
                                                            {sale.clientName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="list-item-info">
                                                            <p className="list-item-title" title={sale.clientName}>{sale.clientName}</p>
                                                            <p className="list-item-subtitle">{new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} • {sale.storeName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="list-item-right">
                                                        <p className="list-item-value">${sale.total.toFixed(2)}</p>
                                                        <span className="list-item-badge badge-outline">
                                                            {sale.paymentMethod}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div id="top-products-list" className="dashboard-card list-card" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                        <div
                            className="card-header border-b border-[var(--border)] pb-3 flex justify-between items-center"
                            style={{ paddingBottom: '0rem', margin: 0, cursor: 'pointer' }}
                            onClick={() => {
                                const nextState = !isTopProductsExpanded;
                                setIsTopProductsExpanded(nextState);
                                if (nextState) {
                                    setTimeout(() => scrollToBottomDuringExpand('top-products-list'), 10);
                                }
                            }}
                            title={isTopProductsExpanded ? "Ocultar productos top" : "Mostrar productos top"}
                        >
                            <h3 className="card-title flex items-center gap-2">
                                <Award size={18} />
                                <span>
                                    Productos Top
                                    {!isTopProductsExpanded && topProducts.length > 0 && (
                                        <span className="font-normal text-sm" style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                            ({topProducts.length} Items)
                                        </span>
                                    )}
                                </span>
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {isTopProductsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>
                        <div className={`accordion-wrapper ${isTopProductsExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                                <div className="list-content mt-3">
                                    {topProducts.length === 0 ? (
                                        <p className="text-muted text-sm text-center py-4">Aún no hay ventas registradas.</p>
                                    ) : (
                                        <div className="list-content" style={{ paddingTop: '1rem' }}>
                                            {topProducts.map(item => (
                                                <div key={item.product.id} className="list-item-card">
                                                    <div className="list-item-left">
                                                        <div className="list-item-avatar avatar-blue">
                                                            <Award size={20} />
                                                        </div>
                                                        <div className="list-item-info">
                                                            <p className="list-item-title" title={item.product.name}>{item.product.name}</p>
                                                            <p className="list-item-subtitle">{item.product.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="list-item-right">
                                                        <p className="list-item-value">{item.count} unid.</p>
                                                        <span className="list-item-badge badge-outline">Top</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COL 2 --- */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Critical Stock */}
                    <div id="critical-stock-list" className="dashboard-card list-card" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                        <div
                            className="card-header border-b border-[var(--border)] pb-3 flex justify-between items-center"
                            style={{ paddingBottom: '0rem', margin: 0, cursor: 'pointer' }}
                            onClick={() => {
                                const nextState = !isStockExpanded;
                                setIsStockExpanded(nextState);
                                if (nextState) {
                                    setTimeout(() => scrollToBottomDuringExpand('critical-stock-list'), 10);
                                }
                            }}
                            title={isStockExpanded ? "Ocultar stock crítico" : "Mostrar stock crítico"}
                        >
                            <h3 className="card-title flex items-center gap-2">
                                <Package size={18} />
                                <span>
                                    Stock Crítico
                                    {!isStockExpanded && criticalProducts.length > 0 && (
                                        <span className="font-normal text-sm" style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                            ({criticalProducts.length} Productos)
                                        </span>
                                    )}
                                </span>
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {isStockExpanded && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsRequestModalOpen(true);
                                        }}
                                        className={highlightRequestBtn ? 'btn-attention' : ''}
                                    >
                                        Solicitar Productos
                                    </Button>
                                )}
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {isStockExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>
                        <div className={`accordion-wrapper ${isStockExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                                <div className="list-content mt-3">
                                    {criticalProducts.length === 0 ? (
                                        <p className="text-muted text-sm text-center py-4">Todo el inventario está en niveles óptimos.</p>
                                    ) : (
                                        <div className="list-content" style={{ paddingTop: '1rem' }}>
                                            {criticalProducts.slice(0, 5).map(prod => {
                                                const isDanger = prod.stock === 0;
                                                return (
                                                    <div key={prod.id} className="list-item-card">
                                                        <div className="list-item-left">
                                                            <div className={`list-item-avatar ${isDanger ? 'avatar-red' : 'avatar-orange'}`}>
                                                                <Package size={20} />
                                                            </div>
                                                            <div className="list-item-info">
                                                                <p className="list-item-title" title={prod.name}>{prod.name}</p>
                                                                <p className="list-item-subtitle">{prod.category} • Min: {prod.minStock}</p>
                                                            </div>
                                                        </div>
                                                        <div className="list-item-right">
                                                            <p className="list-item-value" style={{ color: isDanger ? 'var(--destructive)' : '#f97316' }}>{prod.stock} disp.</p>
                                                            <span className={`list-item-badge ${isDanger ? 'badge-danger' : 'badge-warning'}`}>
                                                                {isDanger ? 'Agotado' : 'Crítico'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* --- COL 3 --- */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Latest Clients */}
                    <div id="latest-clients-list" className="dashboard-card list-card" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                        <div
                            className="card-header border-b border-[var(--border)] pb-3 flex justify-between items-center"
                            style={{ paddingBottom: '0rem', margin: 0, cursor: 'pointer' }}
                            onClick={() => {
                                const nextState = !isClientsExpanded;
                                setIsClientsExpanded(nextState);
                                if (nextState) {
                                    setTimeout(() => scrollToBottomDuringExpand('latest-clients-list'), 10);
                                }
                            }}
                            title={isClientsExpanded ? "Ocultar clientes" : "Mostrar clientes"}
                        >
                            <h3 className="card-title flex items-center gap-2">
                                <Users size={18} />
                                <span>
                                    Últimos Clientes
                                    {!isClientsExpanded && latestClients.length > 0 && (
                                        <span className="font-normal text-sm" style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                            ({latestClients.length} Nuevos)
                                        </span>
                                    )}
                                </span>
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {isClientsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>
                        <div className={`accordion-wrapper ${isClientsExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                                <div className="list-content mt-3">
                                    {latestClients.length === 0 ? (
                                        <p className="text-muted text-sm text-center py-4">No hay clientes registrados.</p>
                                    ) : (
                                        <div className="list-content" style={{ paddingTop: '1rem' }}>
                                            {latestClients.map(client => (
                                                <div key={client.id} className="list-item-card">
                                                    <div className="list-item-left">
                                                        <div className="list-item-avatar avatar-purple">
                                                            <Users size={20} />
                                                        </div>
                                                        <div className="list-item-info">
                                                            <p className="list-item-title" title={client.fullName}>{client.fullName}</p>
                                                            <p className="list-item-subtitle">{client.documentType}: {client.documentNumber}</p>
                                                        </div>
                                                    </div>
                                                    <div className="list-item-right">
                                                        <span className="list-item-badge badge-outline">
                                                            {client.department}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Investment Data */}
                    <div id="investment-data" className="dashboard-card list-card" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                        <div
                            className="card-header border-b border-[var(--border)] pb-3 flex justify-between items-center"
                            style={{ paddingBottom: '0rem', margin: 0, cursor: 'pointer' }}
                            onClick={() => {
                                const nextState = !isInvestmentExpanded;
                                setIsInvestmentExpanded(nextState);
                                if (nextState) {
                                    setTimeout(() => scrollToBottomDuringExpand('investment-data'), 10);
                                }
                            }}
                            title={isInvestmentExpanded ? "Ocultar inversión" : "Mostrar inversión"}
                        >
                            <h3 className="card-title flex items-center gap-2">
                                <PieChartIcon size={18} />
                                <span>Inversión y Ganancia</span>
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {isInvestmentExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>
                        <div className={`accordion-wrapper ${isInvestmentExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                                <div className="list-content mt-3" style={{ height: '300px' }}>
                                    {investmentData[0].value === 0 && investmentData[1].value === 0 ? (
                                        <p className="text-muted text-sm text-center py-4" style={{ marginTop: '3rem' }}>No hay productos en inventario.</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={investmentData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="var(--primary)" />
                                                    <Cell fill="var(--success)" />
                                                </Pie>
                                                <RechartsTooltip
                                                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                                                    contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <ProductRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                products={products}
                activeStoreId={activeStoreId}
                stores={stores}
                onSubmit={handleProductRequestSubmit}
            />
        </div>
    );
};
