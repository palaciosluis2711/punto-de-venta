import React, { useRef } from 'react';
import { useTicketSettings } from '../hooks/useTicketSettings';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Upload, Printer, Ticket } from 'lucide-react';
import { ReceiptPreview } from '../../sales/components/ReceiptPreview';
import type { Sale } from '../../sales/types';
import './TicketSettings.css';

// Dummy sale data for preview
const PREVIEW_SALE: Sale = {
    id: 'PREVIEW-123',
    date: new Date().toISOString(),
    total: 150.00,
    items: [
        {
            productId: '1',
            productName: 'Cuaderno Profesional',
            quantity: 2,
            unitPrice: 45.00,
            subtotal: 90.00
        },
        {
            productId: '2',
            productName: 'Lápiz HB #2',
            quantity: 3,
            unitPrice: 5.00,
            subtotal: 15.00
        },
        {
            productId: '3',
            productName: 'Juego de Geometría',
            quantity: 1,
            unitPrice: 45.00,
            subtotal: 45.00
        }
    ],
    paymentMethod: 'Efectivo',
    clientName: 'Cliente General',
    storeId: 'store-1',
    storeName: 'Tienda Principal',
    receivedAmount: 200.00,
    change: 50.00,
    status: 'completed'
};

export const TicketSettings: React.FC = () => {
    const { settings, updateSettings } = useTicketSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            updateSettings({
                logoUrl: reader.result as string,
                logoFileName: file.name
            });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="settings-container animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="settings-header-section">
                <div className="settings-header-title-bar">
                    <div className="header-title-group">
                        <div className="header-icon-box">
                            <Ticket size={24} />
                        </div>
                        <div>
                            <h2 className="header-title">Configuración de Ticket</h2>
                            <p className="header-subtitle">Personaliza la información que aparece en los tickets de venta.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-content-wrapper">
                {/* Left Column: Form Container */}
                <div className="settings-main-panel">
                    <div className="form-section">
                        <h3 className="form-section-title">Información del Negocio</h3>
                        <div className="settings-grid">
                            {/* Row 1 */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre de la Tienda</label>
                                <Input
                                    value={settings.storeName}
                                    onChange={(e) => updateSettings({ storeName: e.target.value })}
                                    placeholder="Ej. Papelería El Lápiz"
                                />
                            </div>

                            <div className="settings-grid">
                                <div>
                                    <label className="block text-sm font-medium mb-1">NIT</label>
                                    <Input
                                        value={settings.nit}
                                        onChange={(e) => updateSettings({ nit: e.target.value })}
                                        placeholder="NIT"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">NRC</label>
                                    <Input
                                        value={settings.nrc}
                                        onChange={(e) => updateSettings({ nrc: e.target.value })}
                                        placeholder="NRC"
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="settings-col-full">
                                <label className="block text-sm font-medium mb-1">Dirección</label>
                                <Input
                                    value={settings.address}
                                    onChange={(e) => updateSettings({ address: e.target.value })}
                                    placeholder="Calle, Número, Colonia, Ciudad"
                                />
                            </div>

                            {/* Row 3 */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Teléfono</label>
                                <Input
                                    value={settings.phone}
                                    onChange={(e) => updateSettings({ phone: e.target.value })}
                                    placeholder="Teléfono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Sitio Web / Redes</label>
                                <Input
                                    value={settings.website}
                                    onChange={(e) => updateSettings({ website: e.target.value })}
                                    placeholder="facebook.com/papeleria"
                                />
                            </div>

                            {/* Row 4 */}
                            <div className="settings-col-full">
                                <label className="block text-sm font-medium mb-1">Mensaje Pie de Página</label>
                                <Input
                                    value={settings.footerMessage}
                                    onChange={(e) => updateSettings({ footerMessage: e.target.value })}
                                    placeholder="Mensaje al final del ticket (ej. ¡Gracias por su compra!)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section-title">Diseño y Logo</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Logo del Ticket</label>
                                {settings.logoUrl ? (
                                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-surface">
                                        <div className="bg-white p-1 rounded border border-border shadow-sm flex-shrink-0">
                                            <img
                                                src={settings.logoUrl}
                                                alt="Ticket Logo"
                                                className="h-10 w-auto object-contain"
                                                style={{ maxWidth: '80px' }}
                                            />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate">
                                                Archivo cargado: <span className="font-normal text-text-muted">{settings.logoFileName || 'logo.png'}</span>
                                            </p>
                                        </div>
                                        <div className="options-grid">
                                            <div
                                                className="option-chip"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                Cambiar
                                            </div>
                                            <div
                                                className="option-chip text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                                                onClick={() => updateSettings({ logoUrl: undefined, logoFileName: undefined })}
                                            >
                                                Quitar Imagen
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                                        <div className="text-muted-foreground py-2">
                                            <Upload size={24} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Sube tu logo aquí</p>
                                            <p className="text-xs opacity-70">Recomendado: Blanco y Negro, PNG</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Seleccionar Imagen
                                        </Button>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section-title">Tamaño de Impresión</h3>
                        <div className="space-y-4">
                            <div className="space-y-3 pt-2">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-3 text-text-secondary">Ancho de Papel Térmico</label>
                                    <div className="options-grid">
                                        <div
                                            className={`option-chip ${settings.printerWidth === '80mm' ? 'active' : ''}`}
                                            onClick={() => updateSettings({ printerWidth: '80mm' })}
                                        >
                                            80mm (Estándar)
                                        </div>
                                        <div
                                            className={`option-chip ${settings.printerWidth === '57mm' ? 'active' : ''}`}
                                            onClick={() => updateSettings({ printerWidth: '57mm' })}
                                        >
                                            57mm (Pequeño)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3" style={{ marginTop: '2rem' }}>
                                    <label className="toggle-switch-container">
                                        <span className="toggle-label">Mostrar Logo en Ticket</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                style={{ display: 'none' }}
                                                checked={settings.showLogo}
                                                onChange={(e) => updateSettings({ showLogo: e.target.checked })}
                                            />
                                            <div className={`toggle-track ${settings.showLogo ? 'active' : ''}`}>
                                                <div className="toggle-thumb"></div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="toggle-switch-container">
                                        <span className="toggle-label">Mostrar Dirección</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                style={{ display: 'none' }}
                                                checked={settings.showAddress}
                                                onChange={(e) => updateSettings({ showAddress: e.target.checked })}
                                            />
                                            <div className={`toggle-track ${settings.showAddress ? 'active' : ''}`}>
                                                <div className="toggle-thumb"></div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="toggle-switch-container">
                                        <span className="toggle-label">Mostrar Datos del Cliente</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                style={{ display: 'none' }}
                                                checked={settings.showClient}
                                                onChange={(e) => updateSettings({ showClient: e.target.checked })}
                                            />
                                            <div className={`toggle-track ${settings.showClient ? 'active' : ''}`}>
                                                <div className="toggle-thumb"></div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview Container */}
                <div className="settings-sidebar">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Printer size={20} />
                            Previsualización
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {settings.printerWidth}
                        </span>
                    </div>

                    <div className="bg-gray-100/50 p-4 rounded-xl border border-dashed border-gray-300 flex justify-center items-start overflow-auto" style={{ maxHeight: '600px' }}>
                        <div className="bg-white shadow-xl rounded-sm overflow-hidden ring-1 ring-black/5 transition-all duration-300 transform scale-90 origin-top">
                            <ReceiptPreview
                                sale={PREVIEW_SALE}
                                settings={settings}
                                width={settings.printerWidth as any}
                            />
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Esta es una vista previa aproximada.
                    </p>
                </div>
            </div>
        </div>
    );
};
