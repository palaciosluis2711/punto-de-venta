import React, { useRef } from 'react';
import { useTicketSettings } from '../hooks/useTicketSettings';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Upload, Trash2, Printer, Ticket } from 'lucide-react';
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
            updateSettings({ logoUrl: reader.result as string });
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
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre de la Tienda</label>
                                <Input
                                    value={settings.storeName}
                                    onChange={(e) => updateSettings({ storeName: e.target.value })}
                                    placeholder="Ej. Papelería El Lápiz"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Dirección</label>
                                <Input
                                    value={settings.address}
                                    onChange={(e) => updateSettings({ address: e.target.value })}
                                    placeholder="Calle, Número, Colonia, Ciudad"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                                    <Input
                                        value={settings.phone}
                                        onChange={(e) => updateSettings({ phone: e.target.value })}
                                        placeholder="Teléfono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">RFC / ID Fiscal</label>
                                    <Input
                                        value={settings.rfc}
                                        onChange={(e) => updateSettings({ rfc: e.target.value })}
                                        placeholder="RFC"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Sitio Web / Redes</label>
                                <Input
                                    value={settings.website}
                                    onChange={(e) => updateSettings({ website: e.target.value })}
                                    placeholder="facebook.com/papeleria"
                                />
                            </div>

                            <div>
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
                                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                                    {settings.logoUrl ? (
                                        <div className="relative">
                                            <img
                                                src={settings.logoUrl}
                                                alt="Ticket Logo"
                                                className="h-32 object-contain mb-2 bg-white p-2 rounded border"
                                                style={{ maxWidth: '100%' }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full"
                                                onClick={() => updateSettings({ logoUrl: undefined })}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground py-4">
                                            <Upload size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Sube tu logo aquí</p>
                                            <p className="text-xs opacity-70">Recomendado: Blanco y Negro, PNG</p>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                    />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {settings.logoUrl ? 'Cambiar Logo' : 'Seleccionar Imagen'}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border">
                                    <span className="text-sm font-medium">Ancho de Impresión</span>
                                    <div className="flex gap-2">
                                        <button
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${settings.printerWidth === '80mm' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80'}`}
                                            onClick={() => updateSettings({ printerWidth: '80mm' })}
                                        >
                                            80mm
                                        </button>
                                        <button
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${settings.printerWidth === '57mm' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80'}`}
                                            onClick={() => updateSettings({ printerWidth: '57mm' })}
                                        >
                                            57mm
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 p-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="showLogo"
                                            checked={settings.showLogo}
                                            onChange={(e) => updateSettings({ showLogo: e.target.checked })}
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                        />
                                        <label htmlFor="showLogo" className="text-sm">Mostrar Logo</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="showAddress"
                                            checked={settings.showAddress}
                                            onChange={(e) => updateSettings({ showAddress: e.target.checked })}
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                        />
                                        <label htmlFor="showAddress" className="text-sm">Mostrar Dirección</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="showClient"
                                            checked={settings.showClient}
                                            onChange={(e) => updateSettings({ showClient: e.target.checked })}
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                        />
                                        <label htmlFor="showClient" className="text-sm">Mostrar Datos del Cliente</label>
                                    </div>
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
