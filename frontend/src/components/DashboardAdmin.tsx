import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Reserva, Barbero, Servicio, AdminSubView } from './types';
import { SkeletonList, SkeletonStats } from './Skeleton';
import { CreateBarberModal } from './CreateBarberModal';
import { CreateServiceModal } from './CreateServiceModal';
import './DashboardAdmin.css';

interface DashboardAdminProps {
    reservas: Reserva[];
    barberos: Barbero[];
    servicios: Servicio[];
    estadisticas: any;
    loading: boolean;
    onEliminarBarbero: (id: number) => void;
    onEliminarServicio: (id: number) => void;
    onCreateBarber: (data: any) => Promise<void>;
    onCreateService: (data: any) => Promise<void>;
    onCancelReserva: (id: number) => Promise<void>;
}

export function DashboardAdmin({
    reservas,
    barberos,
    servicios,
    estadisticas,
    loading,
    onEliminarBarbero,
    onEliminarServicio,
    onCreateBarber,
    onCreateService,
    onCancelReserva
}: DashboardAdminProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<AdminSubView>('estadisticas');
    const [showCreateBarber, setShowCreateBarber] = useState(false);
    const [showCreateService, setShowCreateService] = useState(false);

    // Sincronizar tab con la URL
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/admin/reservas')) {
            setActiveTab('reservas');
        } else if (path.includes('/admin/barberos')) {
            setActiveTab('barberos');
        } else if (path.includes('/admin/servicios')) {
            setActiveTab('servicios');
        } else {
            setActiveTab('estadisticas');
            if (path === '/admin' || path === '/admin/') {
                navigate('/admin/estadisticas', { replace: true });
            }
        }
    }, [location.pathname, navigate]);

    const handleTabChange = (tab: AdminSubView) => {
        setActiveTab(tab);
        navigate(`/admin/${tab}`);
    };

    return (
        <div className="admin-panel">
            <h2>Panel Super Admin</h2>

            <div className="admin-tabs">
                <button
                    className={activeTab === 'estadisticas' ? 'active' : ''}
                    onClick={() => handleTabChange('estadisticas')}
                >
                    Estadísticas
                </button>
                <button
                    className={activeTab === 'reservas' ? 'active' : ''}
                    onClick={() => handleTabChange('reservas')}
                >
                    Reservas
                </button>
                <button
                    className={activeTab === 'barberos' ? 'active' : ''}
                    onClick={() => handleTabChange('barberos')}
                >
                    Barberos
                </button>
                <button
                    className={activeTab === 'servicios' ? 'active' : ''}
                    onClick={() => handleTabChange('servicios')}
                >
                    Servicios
                </button>
            </div>

            {activeTab === 'estadisticas' && (
                <div className="estadisticas-section">
                    <h3>Estadísticas y Métricas</h3>
                    {loading || !estadisticas ? (
                        <SkeletonStats />
                    ) : (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{estadisticas.reservasPorMes?.[0]?.cantidad || estadisticas.totalReservas || 0}</div>
                                    <div className="stat-label">Reservas Totales</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">
                                        ${(estadisticas.ingresosTotales || 0).toLocaleString()}
                                    </div>
                                    <div className="stat-label">Ingresos Totales</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{barberos.length}</div>
                                    <div className="stat-label">Barberos Activos</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{servicios.length}</div>
                                    <div className="stat-label">Servicios Activos</div>
                                </div>
                            </div>

                            <div className="stats-details">
                                <div className="top-list">
                                    <h4>Top Barberos</h4>
                                    {estadisticas.barberosActivos?.map((b: any, i: number) => (
                                        <div key={i} className="top-item">
                                            <span>{b.nombre} {b.apellido}</span>
                                            <span>{b.reservas} reservas</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="top-list">
                                    <h4>Top Servicios</h4>
                                    {estadisticas.serviciosPopulares?.map((s: any, i: number) => (
                                        <div key={i} className="top-item">
                                            <span>{s.nombre}</span>
                                            <span>{s.reservas} reservas</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'reservas' && (
                <div>
                    <h3>Todas las Reservas</h3>
                    {loading ? (
                        <SkeletonList count={5} />
                    ) : (
                        <div className="reservas-list">
                            {reservas.map(reserva => (
                                <div key={reserva.id} className="reserva-card">
                                    <div className="reserva-header">
                                        <h4>{reserva.servicio_nombre}</h4>
                                        <span className={`estado estado-${reserva.estado}`}>{reserva.estado}</span>
                                    </div>
                                    <p><strong>Cliente:</strong> {reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                                    <p><strong>Barbero:</strong> {reserva.barbero_nombre} {reserva.barbero_apellido}</p>
                                    <p><strong>Fecha:</strong> {new Date(reserva.fecha_hora).toLocaleString()}</p>
                                    {reserva.estado !== 'cancelada' && (
                                        <button
                                            className="btn-danger btn-sm"
                                            onClick={() => onCancelReserva(reserva.id)}
                                        >
                                            Cancelar Reserva
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'barberos' && (
                <div>
                    <div className="section-header">
                        <h3>Gestión de Barberos</h3>
                        <button className="btn-primary" onClick={() => setShowCreateBarber(true)}>
                            + Registrar Barbero
                        </button>
                    </div>
                    {loading ? (
                        <SkeletonList count={4} />
                    ) : (
                        <div className="barberos-list">
                            {barberos.map(barbero => (
                                <div key={barbero.id} className="barbero-admin-card">
                                    <div className="barbero-info">
                                        <h4>{barbero.nombre} {barbero.apellido}</h4>
                                        <p>Email: {barbero.email}</p>
                                        <p>Estado: <span className={`status-${barbero.estado}`}>{barbero.estado}</span></p>
                                        <p>Experiencia: {barbero.experiencia_anios} años</p>
                                        <p>Turno: {barbero.turno_trabajo}</p>
                                    </div>
                                    <div className="barbero-actions">
                                        <button className="btn-secondary">Editar</button>
                                        <button
                                            onClick={() => onEliminarBarbero(barbero.id)}
                                            className="btn-danger"
                                        >
                                            Desactivar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'servicios' && (
                <div>
                    <div className="section-header">
                        <h3>Gestión de Servicios</h3>
                        <button className="btn-primary" onClick={() => setShowCreateService(true)}>
                            + Nuevo Servicio
                        </button>
                    </div>
                    {loading ? (
                        <SkeletonList count={4} />
                    ) : (
                        <div className="servicios-list">
                            {servicios.map(servicio => (
                                <div key={servicio.id} className="servicio-admin-card">
                                    <div className="servicio-info">
                                        <h4>{servicio.nombre}</h4>
                                        <p>{servicio.descripcion}</p>
                                        <p>Precio: ${servicio.precio.toLocaleString()}</p>
                                        <p>Duración: {servicio.duracion_min} minutos</p>
                                        <p>Estado: {servicio.activo ? 'Activo' : 'Inactivo'}</p>
                                    </div>
                                    <div className="servicio-actions">
                                        <button className="btn-secondary">Editar</button>
                                        <button
                                            onClick={() => onEliminarServicio(servicio.id)}
                                            className="btn-danger"
                                        >
                                            Desactivar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showCreateBarber && (
                <CreateBarberModal
                    onClose={() => setShowCreateBarber(false)}
                    onSubmit={async (data) => {
                        await onCreateBarber(data);
                        setShowCreateBarber(false);
                    }}
                    loading={loading}
                />
            )}

            {showCreateService && (
                <CreateServiceModal
                    onClose={() => setShowCreateService(false)}
                    onSubmit={async (data) => {
                        await onCreateService(data);
                        setShowCreateService(false);
                    }}
                    loading={loading}
                />
            )}
        </div>
    );
}
