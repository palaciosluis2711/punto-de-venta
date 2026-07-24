const fs = require('fs');
let code = fs.readFileSync('src/modules/dashboard/DashboardPage.tsx', 'utf8');

const newStates = `
    const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
    const [storeFilter, setStoreFilter] = useState<string>('all');
`;

code = code.replace(
    /const \[isTopProductsExpanded, setIsTopProductsExpanded\] = useState\(false\);/,
    `const [isTopProductsExpanded, setIsTopProductsExpanded] = useState(false);\n${newStates}`
);

const calculationsReplacement = `
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
                dataMap[\`\${i.toString().padStart(2, '0')}:00\`] = { ingresos: 0, ganancia: 0 };
            }
        } else if (timeFilter === 'week' || timeFilter === 'month') {
            const days = timeFilter === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const startD = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
            for (let i = 0; i < days; i++) {
                const d = new Date(startD.getTime() + (i * 24 * 60 * 60 * 1000));
                if (d > now) break;
                const dateStr = \`\${d.getDate().toString().padStart(2, '0')}/\${(d.getMonth() + 1).toString().padStart(2, '0')}\`;
                dataMap[dateStr] = { ingresos: 0, ganancia: 0 };
            }
        } else if (timeFilter === 'year' || timeFilter === 'all') {
            for (let i = 0; i < 12; i++) {
                const dateStr = \`\${(i + 1).toString().padStart(2, '0')}/\${now.getFullYear()}\`;
                dataMap[dateStr] = { ingresos: 0, ganancia: 0 };
            }
        }

        filteredSales.forEach(sale => {
            const saleDate = new Date(sale.date);
            let key = '';
            
            if (timeFilter === 'day') {
                key = \`\${saleDate.getHours().toString().padStart(2, '0')}:00\`;
            } else if (timeFilter === 'week' || timeFilter === 'month') {
                key = \`\${saleDate.getDate().toString().padStart(2, '0')}/\${(saleDate.getMonth() + 1).toString().padStart(2, '0')}\`;
            } else if (timeFilter === 'year' || timeFilter === 'all') {
                key = \`\${(saleDate.getMonth() + 1).toString().padStart(2, '0')}/\${saleDate.getFullYear()}\`;
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

    const getChartTitle = () => {
        if (timeFilter === 'day') return "Tendencia de Ventas (Hoy)";
        if (timeFilter === 'week') return "Tendencia de Ventas (Esta Semana)";
        if (timeFilter === 'month') return "Tendencia de Ventas (Este Mes)";
        if (timeFilter === 'year') return "Tendencia de Ventas (Este Año)";
        return "Tendencia de Ventas (Histórico)";
    };
`;

const calcStartIndex = code.indexOf('    // -- CALCULATIONS -- //');
const calcEndIndex = code.indexOf('    return (');

code = code.substring(0, calcStartIndex) + calculationsReplacement + '\n' + code.substring(calcEndIndex);

const headerReplacement = `
        <div className="dashboard-page animate-in fade-in zoom-in-95 duration-500">
            <div className="dashboard-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Panel de Control</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Resumen de actividad y métricas del negocio.
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PERÍODO</label>
                        <select 
                            className="input" 
                            style={{ padding: '0.4rem 0.75rem', minWidth: '150px' }}
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value as any)}
                        >
                            <option value="day">Hoy</option>
                            <option value="week">Esta Semana</option>
                            <option value="month">Este Mes</option>
                            <option value="year">Este Año</option>
                            <option value="all">Todos</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TIENDA</label>
                        <select 
                            className="input" 
                            style={{ padding: '0.4rem 0.75rem', minWidth: '180px' }}
                            value={storeFilter}
                            onChange={(e) => setStoreFilter(e.target.value)}
                        >
                            <option value="all">Todas las Tiendas</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
`;

code = code.replace(
    /<div className="dashboard-page[\s\S]*?<\/div>\n\s*\{\/\* -- METRICS CARDS -- \*\/\}/,
    headerReplacement + '\n            {/* -- METRICS CARDS -- */}'
);

code = code.replace(/<h3 className="card-title">Tendencia de Ventas \(Últimos 7 días\)<\/h3>/, '<h3 className="card-title">{getChartTitle()}</h3>');

fs.writeFileSync('src/modules/dashboard/DashboardPage.tsx', code);
console.log('Fixed dashboard');
