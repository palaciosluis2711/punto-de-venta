import React from 'react';
import { useToast } from '../../../shared/components/Toast/useToast';
import { Button } from '../../../shared/components/Button';
import { Bell } from 'lucide-react';

export const ToastSettingsForm: React.FC = () => {
    const { settings, updateSettings, showToast } = useToast();

    const COLORS = [
        { value: 'default', label: 'Por Defecto', background: 'linear-gradient(135deg, #10b981 33%, #3b82f6 33%, #3b82f6 66%, #ef4444 66%)' },
        { value: 'blue', label: 'Azul', background: '#3b82f6' },
        { value: 'green', label: 'Verde', background: '#10b981' },
        { value: 'red', label: 'Rojo', background: '#ef4444' },
        { value: 'purple', label: 'Morado', background: '#8b5cf6' },
        { value: 'orange', label: 'Naranja', background: '#f97316' },
        { value: 'black', label: 'Negro', background: '#1e293b' }
    ] as const;

    return (
        <div className="settings-container animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Notificaciones Visuales</h2>
                            <p className="header-subtitle">
                                Configura la apariencia y el comportamiento de las notificaciones emergentes (Toasts) del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-content-wrapper">
                <div className="settings-main-panel" style={{ maxWidth: '600px' }}>
                    <div className="form-section">
                        <div className="space-y-4">
                            {/* Animación */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Animación de Entrada</label>
                                <select
                                    className="input"
                                    value={settings.animation}
                                    onChange={(e) => updateSettings({ ...settings, animation: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-main)' }}
                                >
                                    <option value="slide-smooth">Deslizamiento Suave (Recomendado)</option>
                                    <option value="fade">Desvanecimiento (Fade)</option>
                                    <option value="none">Sin Animación</option>
                                </select>
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Elige cómo aparecerán y desaparecerán los avisos.</p>
                            </div>

                            {/* Color */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Color Sólido</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => updateSettings({ ...settings, color: c.value })}
                                            title={c.label}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: c.background,
                                                border: settings.color === c.value ? '3px solid var(--primary)' : '2px solid transparent',
                                                cursor: 'pointer',
                                                padding: 0,
                                                outline: 'none',
                                                boxShadow: settings.color === c.value ? '0 0 0 2px var(--background)' : '0 2px 4px rgba(0,0,0,0.1)',
                                                transition: 'transform 0.2s, border-color 0.2s',
                                                transform: settings.color === c.value ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Elige un color base fijo para todas las notificaciones.</p>
                            </div>

                            {/* Opacidad */}
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    <span>Transparencia (Opacidad)</span>
                                    <span className="text-primary">{Math.round(settings.opacity * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={settings.opacity}
                                    onChange={(e) => updateSettings({ ...settings, opacity: parseFloat(e.target.value) })}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Ajusta qué tan transparentes son las notificaciones.</p>
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <Button onClick={() => showToast('¡Esta es una notificación de prueba!', 'success')}>
                                    Probar Notificación
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
