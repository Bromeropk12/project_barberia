// components/DashboardCliente.tsx - Enhanced Client Dashboard with Modern Components
import { useState, useEffect } from 'react';
import { Reserva, User } from './types';
import ModernMetrics from './ModernMetrics';
import './DashboardCliente.css';
import './ModernComponents.css';

interface DashboardClienteProps {
    user: User;
    reservas: Reserva[];
    loading: boolean;
    onCancelar: (id: number) => void;
    onReprogramar: (reserva: Reserva) => void;
    onLogout: () => void;
}

interface MetricData {
    id: string;
    label: string;
    value: number;
    previousValue?: number;
    icon: string;
    description?: string;
    trend?: 'positive' | 'negative' | 'neutral';
    format?: 'number' | 'currency' | 'percentage';
    color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function DashboardCliente({
    user,
    reservas: initialReservas,
    loading: initialLoading,
    onCancelar,
    onReprogramar,
    onLogout
}: DashboardClienteProps) {
    const [reservas, setReservas] = useState<Reserva[]>(initialReservas);
    const [loading, setLoading] = useState(initialLoading);
    const [activeFilter, setActiveFilter] = useState<'todas' | 'pendiente' | 'confirmada' | 'completada' | 'cancelada'>('todas');

    useEffect(() => {
        setReservas(initialReservas);
        setLoading(initialLoading);
    }, [initialReservas, initialLoading]);

    // Calculate metrics from reservas data
    const metrics: MetricData[] = [
        {
            id: 'total-reservas',
            label: 'Total de Reservas',
            value: reservas.length,
            icon: '📅',
            description: 'Todas tus reservas registradas',
            trend: reservas.length > 5 ? 'positive' : 'neutral',
            color: 'blue'
        },
        {
            id: 'reservas-activas',
            label: 'Reservas Activas',
            value: reservas.filter(r => r.estado === 'confirmada').length,
            icon: '✅',
            description: 'Reservas confirmadas y pendientes',
            trend: 'positive',
            color: 'green'
        },
        {
            id: 'inversion-total',
            label: 'Inversión Total',
            value: reservas.reduce((sum, r) => sum + (r.precio || 0), 0),
            icon: '💰',
            description: 'Total gastado en servicios',
            format: 'currency',
            trend: reservas.length > 0 ? 'positive' : 'neutral',
            color: 'yellow'
        },
        {
            id: 'servicios-completados',
            label: 'Servicios Completados',
            value: reservas.filter(r => r.estado === 'completada').length,
            icon: '✂️',
            description: 'Servicios ya prestados',
            trend: reservas.filter(r => r.estado === 'completada').length > 3 ? 'positive' : 'neutral',
            color: 'green'
        }
    ];

    // Filter reservas based on active filter
    const filteredReservas = reservas.filter(reserva => {
        if (activeFilter === 'todas') return true;
        return reserva.estado === activeFilter;
    });

    const handleFilterChange = (filter: typeof activeFilter) => {
        setActiveFilter(filter);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays === -1) return 'Ayer';
        if (diffDays > 0) return `En ${diffDays} días`;
        return `Hace ${Math.abs(diffDays)} días`;
    };

    const getStatusIcon = (estado: string) => {
        switch (estado) {
            case 'confirmada': return '✅';
            case 'pendiente': return '⏳';
            case 'completada': return '✂️';
            case 'cancelada': return '❌';
            default: return '📅';
        }
    };

    return (
        <div className="dashboard-overview">
            {/* Modern Header */}
            <div className="dashboard-header fade-in">
                <div>
                    <h2>Bienvenido, {user.nombre}</h2>
                    <p>Gestiona tus citas y servicios de barbería</p>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    Cerrar Sesión
                </button>
            </div>

            {/* Modern Metrics */}
            <ModernMetrics metrics={metrics} loading={loading} />

            {/* Quick Actions */}
            <div className="quick-actions slide-in-left">
                <button className="quick-action-btn" onClick={() => window.location.href = '/nueva-reserva'}>
                    📅 Nueva Reserva
                </button>
                <button className="quick-action-btn" onClick={() => handleFilterChange('todas')}>
                    🔍 Ver Todas
                </button>
                <button className="quick-action-btn" onClick={() => window.location.href = '/servicios'}>
                    ✂️ Servicios
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="dashboard-tabs">
                {[
                    { key: 'todas', label: 'Todas', icon: '📋' },
                    { key: 'confirmada', label: 'Confirmadas', icon: '✅' },
                    { key: 'pendiente', label: 'Pendientes', icon: '⏳' },
                    { key: 'completada', label: 'Completadas', icon: '✂️' },
                    { key: 'cancelada', label: 'Canceladas', icon: '❌' }
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        className={`tab-button ${activeFilter === key ? 'active' : ''}`}
                        onClick={() => handleFilterChange(key as typeof activeFilter)}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>

            {/* Reservas Section */}
            <div className="reservas-section">
                <h3>
                    {activeFilter === 'todas' ? 'Todas las Reservas' : `Reservas ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`}
                    <span className="count-badge">{filteredReservas.length}</span>
                </h3>

                {loading ? (
                    <div className="loading fade-in">
                        <div className="pulse">⏳</div>
                        <p>Cargando tus reservas...</p>
                    </div>
                ) : filteredReservas.length === 0 ? (
                    <div className="no-data fade-in">
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <h4>No hay reservas {activeFilter === 'todas' ? '' : activeFilter === 'confirmada' ? 'confirmadas' : activeFilter}</h4>
                            <p>{activeFilter === 'todas' ? 'Aún no has hecho ninguna reserva.' : `No tienes reservas ${activeFilter === 'confirmada' ? 'confirmadas' : activeFilter === 'pendiente' ? 'pendientes' : 'completadas'}.`}</p>
                            <button className="quick-action-btn" onClick={() => window.location.href = '/nueva-reserva'}>
                                📅 Hacer Primera Reserva
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="reservas-list">
                        {filteredReservas.map((reserva, index) => (
                            <div
                                key={reserva.id}
                                className="reserva-card fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="reserva-header">
                                    <div className="service-info">
                                        <h4>{getStatusIcon(reserva.estado)} {reserva.servicio_nombre}</h4>
                                        <p className="service-description">
                                            <strong>Barbero:</strong> {reserva.barbero_nombre} {reserva.barbero_apellido}
                                        </p>
                                    </div>
                                    <div className={`estado estado-${reserva.estado}`}>
                                        {reserva.estado}
                                    </div>
                                </div>

                                <div className="reserva-details">
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-icon">📅</span>
                                            <span className="detail-label">Fecha:</span>
                                            <span className="detail-value">{formatDate(reserva.fecha_hora)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-icon">⏰</span>
                                            <span className="detail-label">Hora:</span>
                                            <span className="detail-value">
                                                {new Date(reserva.fecha_hora).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-icon">💰</span>
                                            <span className="detail-label">Precio:</span>
                                            <span className="detail-value">${reserva.precio?.toLocaleString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-icon">⏱️</span>
                                            <span className="detail-label">Duración:</span>
                                            <span className="detail-value">{reserva.duracion_min} min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {reserva.estado === 'confirmada' && (
                                    <div className="reserva-actions">
                                        <button
                                            onClick={() => onReprogramar(reserva)}
                                            className="btn-secondary action-btn"
                                            title="Reprogramar esta reserva"
                                        >
                                            🔄 Reprogramar
                                        </button>
                                        <button
                                            onClick={() => onCancelar(reserva.id)}
                                            className="btn-danger action-btn"
                                            title="Cancelar esta reserva"
                                        >
                                            ❌ Cancelar
                                        </button>
                                    </div>
                                )}

                                {reserva.estado === 'completada' && (
                                    <div className="completed-actions">
                                        <button
                                            className="review-btn"
                                            onClick={() => window.open(`/review/${reserva.id}`, '_blank')}
                                        >
                                            ⭐ Dejar Reseña
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
