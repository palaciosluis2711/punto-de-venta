import React, { useState } from 'react';
import { Bell, BellRing, Check, Info, AlertTriangle, MessageSquare, Trash2, CheckCircle2, Clock, Store, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useStores } from '../settings/hooks/useStores';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { useOutletContext } from 'react-router-dom';
import type { NotificationPriority } from './types';
import './NotificationsPage.css';

export const NotificationsPage: React.FC = () => {
    const { activeStoreId } = useOutletContext<{ activeStoreId: string }>();
    const { notifications, addNotification, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const { stores } = useStores();

    const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
                    onChange={(e) => setFilterStatus(e.target.value as any)}
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
                                    <div style={{ color: 'var(--muted-foreground)' }}>
                                        {expandedId === notification.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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

                            <div className="notification-actions" style={{ marginLeft: '1rem' }}>
                                {notification.status === 'unread' && (
                                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                        <Check size={16} />
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => deleteNotification(notification.id)}>
                                    <Trash2 size={16} />
                                </Button>
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
                            onChange={(e) => setComposePriority(e.target.value as any)}
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
        </div>
    );
};
