import React, { useState } from 'react';
import { Bell, BellRing, Check, Info, AlertTriangle, MessageSquare, Trash2, CheckCircle2, Clock, Store, ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useStores } from '../settings/hooks/useStores';
import { useTransfers } from '../transfers/hooks/useTransfers';
import { useInventory } from '../inventory/hooks/useInventory';
import { useToast } from '../../shared/components/Toast/useToast';
import { Button } from '../../shared/components/Button';
import { ApproveRequestModal, type ApprovedItem } from './components/ApproveRequestModal';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { NotificationPriority, Notification as AppNotification } from './types';
import './NotificationsPage.css';

const TransferNotes: React.FC<{ notes?: string }> = ({ notes }) => {
    const hasNotes = !!notes && notes.trim().length > 0;

    if (!hasNotes) {
        return (
            <div style={{ fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'var(--surface-hover)', borderRadius: '4px', flexShrink: 0 }}>
                <span style={{ fontWeight: '500', color: 'var(--muted-foreground)' }}>Notas:</span> <span style={{ fontStyle: 'italic', color: 'var(--muted-foreground)' }}>No hay notas</span>
            </div>
        );
    }

    return (
        <div 
            style={{ 
                fontSize: '0.875rem', 
                padding: '0.5rem', 
                backgroundColor: 'var(--surface-hover)', 
                borderRadius: '4px',
                flexShrink: 0
            }}
        >
            <span style={{ fontWeight: '500', color: 'var(--muted-foreground)' }}>Notas:</span>{' '}
            <span style={{ fontStyle: 'italic' }}>{notes}</span>
        </div>
    );
};

export const NotificationsPage: React.FC = () => {
    const { activeStoreId } = useOutletContext<{ activeStoreId: string }>();
    const navigate = useNavigate();
    const { notifications, addNotification, markAsRead, markAllAsRead, deleteNotification, updateNotification } = useNotifications();
    const { stores } = useStores();
    const { transfers, addTransfer } = useTransfers();
    const { products, updateStockBulk } = useInventory();

    const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewingTransferId, setViewingTransferId] = useState<string | null>(null);
    const [requestNotification, setRequestNotification] = useState<AppNotification | null>(null);
    const { showToast } = useToast();

    const viewingTransfer = transfers.find(t => t.id === viewingTransferId);

    // Form state for composing
    const [composeTitle, setComposeTitle] = useState('');
    const [composeMessage, setComposeMessage] = useState('');
    const [composeTarget, setComposeTarget] = useState<string>('all');
    const [composePriority, setComposePriority] = useState<NotificationPriority>('normal');

    // Filter notifications for active store
    const storeNotifications = notifications.filter(n =>
        n.targetStoreId === activeStoreId || n.targetStoreId === 'all'
    );

    const filteredNotifications = storeNotifications.filter(n => {
        if (filterStatus === 'unread') return n.status === 'unread';
        if (filterStatus === 'read') return n.status === 'read';
        return true;
    });

    const handleCopy = (notification: AppNotification) => {
        const text = `Título: ${notification.title}\nMensaje: ${notification.message}\nHora: ${new Date(notification.createdAt).toLocaleString()}\nOrigen: ${getStoreName(notification.sourceStoreId)}`;
        navigator.clipboard.writeText(text);
        showToast('Copiado al Portapapeles con éxito', 'success');
    };

    const handleViewTransfer = (transferId: string) => {
        setViewingTransferId(transferId);
    };

    const handleSendNotification = (e: React.FormEvent) => {
        e.preventDefault();
        addNotification({
            title: composeTitle,
            message: composeMessage,
            sourceStoreId: activeStoreId,
            targetStoreId: composeTarget,
            priority: composePriority,
            type: 'message'
        });
        setIsComposeModalOpen(false);
        setComposeTitle('');
        setComposeMessage('');
        setComposePriority('normal');
    };

    const handleApproveRequest = (approvedItems: ApprovedItem[], notes: string) => {
        if (!requestNotification) return;

        const requesterStoreId = requestNotification.sourceStoreId;
        const requesterStoreName = stores.find(s => s.id === requesterStoreId)?.name || 'Tienda Solicitante';
        const activeStoreName = stores.find(s => s.id === activeStoreId)?.name || 'Tienda Actual';

        // 1. Create Transfer
        const transferItems = approvedItems.map(item => {
            const qty = typeof item.approvedQuantity === 'string' ? parseInt(item.approvedQuantity) || 0 : item.approvedQuantity;
            return {
                productId: item.productId,
                productName: item.productName,
                quantity: qty,
                unitCost: item.unitCost,
                subtotal: qty * item.unitCost
            };
        });

        const totalValue = transferItems.reduce((acc, curr) => acc + curr.subtotal, 0);

        const createdTransfer = addTransfer({
            date: new Date().toISOString(),
            sourceStoreId: activeStoreId,
            sourceStoreName: activeStoreName,
            destinationStoreId: requesterStoreId,
            destinationStoreName: requesterStoreName,
            items: transferItems,
            totalValue,
            status: 'completed',
            notes: notes?.trim() ? `Transferencia generada a partir de solicitud.\nNotas: ${notes}` : 'Transferencia generada a partir de solicitud.'
        });

        const inventoryMovements: { productId: string; storeId: string; quantity: number }[] = [];
        approvedItems.forEach(item => {
            const qty = typeof item.approvedQuantity === 'string' ? parseInt(item.approvedQuantity) || 0 : item.approvedQuantity;
            // Deduct from current store
            inventoryMovements.push({
                productId: item.productId,
                storeId: activeStoreId,
                quantity: -qty
            });
            // Add to requester store
            inventoryMovements.push({
                productId: item.productId,
                storeId: requesterStoreId,
                quantity: qty
            });
        });

        updateStockBulk(inventoryMovements);

        // 3. Notify requester
        addNotification({
            title: 'Solicitud Aprobada',
            message: `${activeStoreName} ha aprobado tu solicitud de productos y se ha generado la transferencia automáticamente.\n\n${notes ? `Notas: ${notes}` : ''}`,
            sourceStoreId: activeStoreId,
            targetStoreId: requesterStoreId,
            priority: 'normal',
            type: 'transfer',
            relatedEntityId: createdTransfer.id
        });

        // 4. Update request notification status
        updateNotification(requestNotification.id, {
            status: 'read',
            relatedEntityId: createdTransfer.id,
            payload: { ...requestNotification.payload, status: 'approved' }
        });

        showToast('Solicitud aprobada y transferencia completada', 'success');
        setRequestNotification(null);
    };

    const getIcon = (type?: string, priority?: string) => {
        if (priority === 'high') return <AlertTriangle size={24} />;
        if (type === 'message') return <MessageSquare size={24} />;
        return <Info size={24} />;
    };

    const getStoreName = (id: string) => {
        if (id === 'system') return 'Sistema';
        if (id === 'all') return 'Todas las sucursales';
        const store = stores.find(s => s.id === id);
        return store ? store.name : 'Desconocido';
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        // Prevent click when clicking action buttons
        if ((e.target as HTMLElement).closest('.notification-actions')) {
            return;
        }
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="notifications-page animate-in fade-in">
            <div className="notifications-header">
                <div>
                    <h1 className="notifications-title">
                        <Bell className="text-primary" size={24} />
                        Centro de Notificaciones
                    </h1>
                    <p className="notifications-subtitle">Administra los mensajes y alertas del sistema</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" onClick={() => markAllAsRead(activeStoreId)}>
                        <CheckCircle2 size={16} /> Marcar todo como leído
                    </Button>
                    <Button onClick={() => setIsComposeModalOpen(true)}>
                        <BellRing size={16} /> Nuevo Aviso
                    </Button>
                </div>
            </div>

            <div className="notifications-filters">
                <select
                    className="input-field"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unread' | 'read')}
                    style={{ width: '200px' }}
                >
                    <option value="all">Todas las Notificaciones</option>
                    <option value="unread">No Leídas</option>
                    <option value="read">Leídas</option>
                </select>
            </div>

            <div className="notifications-list">
                {filteredNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                        <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                        <h3>No hay notificaciones</h3>
                        <p>No tienes notificaciones {filterStatus === 'unread' ? 'sin leer' : ''} en este momento.</p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-card ${notification.status === 'unread' ? 'unread' : ''}`}
                            onClick={(e) => toggleExpand(notification.id, e)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={`notification-icon-wrapper ${notification.priority}`}>
                                {getIcon(notification.type, notification.priority)}
                            </div>

                            <div className="notification-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 className="notification-title">{notification.title}</h3>
                                    <div className="notification-actions-top" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                        {notification.type === 'request' && notification.payload?.status === 'pending' && (
                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); setRequestNotification(notification); }} style={{ marginRight: '0.5rem' }}>
                                                Revisar y Aprobar
                                            </Button>
                                        )}
                                        {notification.type === 'request' && notification.payload?.status === 'approved' && (
                                            <>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', marginRight: '0.5rem' }}>
                                                    Aprobada
                                                </span>
                                                {notification.relatedEntityId && (
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTransfer(notification.relatedEntityId!); }} title="Ver detalles de Transferencia" style={{ marginRight: '0.5rem' }}>
                                                        <ExternalLink size={14} style={{ marginRight: '0.25rem' }} /> Detalles
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {notification.type === 'transfer' && notification.relatedEntityId && (
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTransfer(notification.relatedEntityId!); }} title="Ver detalles de Transferencia" style={{ marginRight: '0.5rem' }}>
                                                <ExternalLink size={14} style={{ marginRight: '0.25rem' }} /> Detalles
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCopy(notification); }} title="Copiar notificación">
                                            <Copy size={16} />
                                        </Button>
                                        {notification.status === 'unread' && (
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} title="Marcar como leído">
                                                <Check size={16} />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} title="Eliminar">
                                            <Trash2 size={16} />
                                        </Button>
                                        <div style={{ color: 'var(--muted-foreground)', marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                            {expandedId === notification.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateRows: expandedId === notification.id ? '1fr' : '0fr',
                                        transition: 'grid-template-rows 0.3s ease-out, margin-top 0.3s ease-out',
                                        marginTop: expandedId === notification.id ? '0.5rem' : '0'
                                    }}
                                >
                                    <div style={{ overflow: 'hidden' }}>
                                        <p className="notification-message" style={{ whiteSpace: 'pre-wrap', margin: 0, paddingBottom: expandedId === notification.id ? '0.5rem' : 0 }}>
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="notification-meta" style={{ marginTop: expandedId === notification.id ? '1rem' : '0' }}>
                                    <div className="notification-meta-item">
                                        <Clock size={14} />
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </div>
                                    <div className="notification-meta-item">
                                        <Store size={14} />
                                        De: {getStoreName(notification.sourceStoreId)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isComposeModalOpen}
                onClose={() => setIsComposeModalOpen(false)}
                title="Nuevo Aviso"
            >
                <form onSubmit={handleSendNotification} className="new-notification-modal-content">
                    <Input
                        label="Título del aviso"
                        value={composeTitle}
                        onChange={(e) => setComposeTitle(e.target.value)}
                        required
                        autoFocus
                    />

                    <div className="input-group">
                        <label className="input-label">Destino</label>
                        <select
                            className="input-field"
                            value={composeTarget}
                            onChange={(e) => setComposeTarget(e.target.value)}
                            required
                        >
                            <option value="all">Todas las sucursales</option>
                            {stores.filter(s => s.id !== activeStoreId).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Prioridad</label>
                        <select
                            className="input-field"
                            value={composePriority}
                            onChange={(e) => setComposePriority(e.target.value as NotificationPriority)}
                        >
                            <option value="low">Baja</option>
                            <option value="normal">Normal</option>
                            <option value="high">Alta (Urgente)</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Mensaje</label>
                        <textarea
                            className="input-field"
                            value={composeMessage}
                            onChange={(e) => setComposeMessage(e.target.value)}
                            rows={4}
                            required
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => setIsComposeModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Enviar Aviso
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!viewingTransferId}
                onClose={() => setViewingTransferId(null)}
                title="Detalle de Transferencia"
            >
                {viewingTransfer && (
                    <div className="transfer-details-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '65vh', overflow: 'hidden' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                            <div className="details-header" style={{ flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 'bold' }}>Orden de Transferencia</h3>
                                    <p style={{ fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>{new Date(viewingTransfer.date).toLocaleDateString()}</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        ID: {viewingTransfer.id.slice(0, 8)}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            style={{ padding: '0.25rem', height: 'auto', color: 'var(--text-secondary)' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(viewingTransfer.id);
                                                showToast('Copiado al Portapapeles con éxito', 'success');
                                            }}
                                            title="Copiar ID"
                                        >
                                            <Copy size={14} />
                                        </Button>
                                    </p>
                                    <span style={{
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        backgroundColor: viewingTransfer.status === 'completed'
                                            ? (viewingTransfer.notes?.includes('automática') ? '#8b5cf6' : 'var(--success)')
                                            : 'var(--danger)',
                                        color: '#fff'
                                    }}>
                                        {viewingTransfer.status === 'completed' ? 'Completado' : 'Cancelado'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-hover)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                                        <span style={{ color: 'var(--muted-foreground)' }}>Origen:</span> <span style={{ fontWeight: '500' }}>{viewingTransfer.sourceStoreName}</span>
                                    </p>
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                                        <span style={{ color: 'var(--muted-foreground)' }}>Destino:</span> <span style={{ fontWeight: '500' }}>{viewingTransfer.destinationStoreName}</span>
                                    </p>
                                </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                                    <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Producto</th>
                                                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Cant.</th>
                                                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Valor U.</th>
                                                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingTransfer.items.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.2rem' }}>{item.productName}</td>
                                                    <td style={{ padding: '0.2rem', textAlign: 'right' }}>{item.quantity}</td>
                                                    <td style={{ padding: '0.2rem', textAlign: 'right' }}>${item.unitCost.toFixed(2)}</td>
                                                    <td style={{ padding: '0.2rem', textAlign: 'right', fontWeight: '100' }}>${item.subtotal.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ backgroundColor: 'var(--muted)', fontWeight: '100', padding: '0.2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <span style={{ marginRight: '1rem' }}>Valor Total Transferido</span>
                                    <span style={{ fontSize: '1rem' }}>${viewingTransfer.totalValue.toFixed(2)}</span>
                                </div>
                            </div>

                            <TransferNotes notes={viewingTransfer.notes} />
                        </div>

                        {/* Modal Actions */}
                        <div className="modal-actions flex justify-end items-center pt-4 border-t border-border no-print" style={{ gap: '1rem', flexShrink: 0 }}>
                            <Button variant="outline" onClick={() => {
                                localStorage.setItem('app_transfers_details_open', 'true');
                                localStorage.setItem('app_transfers_view_id', viewingTransfer.id);
                                navigate('/transfers');
                            }}>
                                Ir a Transferencias
                            </Button>
                            <Button onClick={() => setViewingTransferId(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ApproveRequestModal
                isOpen={!!requestNotification}
                onClose={() => setRequestNotification(null)}
                notification={requestNotification}
                products={products}
                stores={stores}
                activeStoreId={activeStoreId}
                onSubmit={handleApproveRequest}
            />
        </div>
    );
};
