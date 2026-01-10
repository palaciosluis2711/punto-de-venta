import React from 'react';

export const DashboardPage: React.FC = () => {
    return (
        <div className="animate-in" style={{ height: '100%', overflowY: 'auto' }}>
            <h1>Panel de Control</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Bienvenido al sistema de administración de tu papelería.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginTop: '2rem'
            }}>
                {/* Placeholder Stats Cards */}
                {['Ventas Hoy', 'Productos Bajos', 'Nuevos Clientes'].map((title) => (
                    <div key={title} style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{title}</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>--</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
