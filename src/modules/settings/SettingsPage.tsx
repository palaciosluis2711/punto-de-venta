import React, { useState } from 'react';
import { CategoriesSettings } from './components/CategoriesSettings';
import { BrandsSettings } from './components/BrandsSettings';
import { UnitsSettings } from './components/UnitsSettings';
import { StoresSettings } from './components/StoresSettings';
import { TaxesSettings } from './components/TaxesSettings';

type SettingsTab = 'categories' | 'brands' | 'units' | 'stores' | 'taxes';

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

    return (
        <div className="animate-in flex gap-8" style={{ display: 'flex', gap: '2rem', height: '100%', flex: 1, overflow: 'hidden' }}>
            <aside style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Configuración</h1>
                    <p className="text-muted">Ajustes generales.</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`text-left px-3 py-2 rounded-md font-medium transition-all ${activeTab === 'categories' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                        style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'categories' ? 'var(--surface-hover)' : 'transparent',
                            color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab('brands')}
                        className={`text-left px-3 py-2 rounded-md font-medium transition-all ${activeTab === 'brands' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                        style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'brands' ? 'var(--surface-hover)' : 'transparent',
                            color: activeTab === 'brands' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Marcas
                    </button>
                    <button
                        onClick={() => setActiveTab('units')}
                        className={`text-left px-3 py-2 rounded-md font-medium transition-all ${activeTab === 'units' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                        style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'units' ? 'var(--surface-hover)' : 'transparent',
                            color: activeTab === 'units' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Unidades
                    </button>
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={`text-left px-3 py-2 rounded-md font-medium transition-all ${activeTab === 'stores' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                        style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'stores' ? 'var(--surface-hover)' : 'transparent',
                            color: activeTab === 'stores' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Tiendas
                    </button>
                    <button
                        onClick={() => setActiveTab('taxes')}
                        className={`text-left px-3 py-2 rounded-md font-medium transition-all ${activeTab === 'taxes' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                        style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'taxes' ? 'var(--surface-hover)' : 'transparent',
                            color: activeTab === 'taxes' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Impuestos
                    </button>
                </nav>
            </aside>

            <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'categories' && <CategoriesSettings />}
                {activeTab === 'brands' && <BrandsSettings />}
                {activeTab === 'units' && <UnitsSettings />}
                {activeTab === 'stores' && <StoresSettings />}
                {activeTab === 'taxes' && <TaxesSettings />}
            </main>
        </div>
    );
};
