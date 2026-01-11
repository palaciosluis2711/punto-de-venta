import React, { useState, useEffect } from 'react';
import { useTaxes } from '../hooks/useTaxes';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Percent, Save } from 'lucide-react';

export const TaxesSettings: React.FC = () => {
    const { taxRate, updateTaxRate } = useTaxes();
    const [rateInput, setRateInput] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        setRateInput((taxRate * 100).toString());
    }, [taxRate]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const rate = parseFloat(rateInput);
        if (!isNaN(rate) && rate >= 0 && rate <= 100) {
            updateTaxRate(rate / 100);
            setMessage('Configuración guardada correctamente.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Impuestos</h2>
                <p className="text-muted">Configura los impuestos aplicables a tus productos.</p>
            </div>

            <div style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSave} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-wrapper">
                        <Input
                            label="IVA General (%)"
                            value={rateInput}
                            onChange={(e) => setRateInput(e.target.value)}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="16"
                            icon={<Percent size={18} />}
                        />
                        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            Este porcentaje se utilizará como valor predeterminado para el cálculo de impuestos en productos.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button type="submit" icon={<Save size={18} />}>
                            Guardar Cambios
                        </Button>
                        {message && (
                            <span className="text-success animate-in fade-in" style={{ fontWeight: 500 }}>
                                {message}
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
