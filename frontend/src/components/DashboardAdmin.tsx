// components/DashboardAdmin.tsx - Admin dashboard component
import { useState } from 'react';
import { Reserva, Barbero, Servicio, AdminSubView } from './types';
import { SkeletonList, SkeletonStats } from './Skeleton';

interface DashboardAdminProps {
    reservas: Reserva[];
    barberos: Barbero[];
    servicios: Servicio[];
    estadisticas: any;
    loading: boolean;
    onEliminarBarbero: (id: number) => void;
    onEliminarServicio: (id: number) => void;
}

export function DashboardAdmin({
    reservas,
    barberos,
    servicios,
    estadisticas,
    loading,
    onEliminarBarbero,
    onEliminarServicio
}: DashboardAdminProps) {
    const [activeTab, setActiveTab] = useState<AdminSubView>('estadisticas');

    return (
        <div className="admin-panel">
            <h2>Panel Super Admin</h2>

            <div className="admin-tabs">
                <button
                    className={activeTab === 'estadisticas' ? 'active' : ''}
                    onClick={() => setActiveTab('estadisticas')}
                >
                    Estadísticas
                </button>
                <button
                    className={activeTab === 'reservas' ? 'active' : ''}
                    onClick={() => setActiveTab('reservas')}
                >
                    Reservas
                </button>
                <button
                    className={activeTab === 'barberos' ? 'active' : ''}
                    onClick={() => setActiveTab('barberos')}
                >
                    Barberos
                </button>
                <button
                    className={activeTab === 'servicios' ? 'active' : ''}
                    onClick={() => setActiveTab('servicios')}
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
                                    <div className="stat-value">{estadisticas.reservas?.mes || 0}</div>
                                    <div className="stat-label">Reservas este Mes</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">
                                        ${(estadisticas.ingresos?.mes || 0).toLocaleString()}
                                    </div>
                                    <div className="stat-label">Ingresos del Mes</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{estadisticas.barberosActivos || 0}</div>
                                    <div className="stat-label">Barberos Activos</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{estadisticas.serviciosActivos || 0}</div>
                                    <div className="stat-label">Servicios Disponibles</div>
                                </div>
                            </div>

                            <div className="stats-details">
                                <div className="top-list">
                                    <h4>Top Barberos</h4>
                                    {estadisticas.topBarberos?.map((b: any, i: number) => (
                                        <div key={i} className="top-item">
                                            <span>{b.nombre} {b.apellido}</span>
                                            <span>{b.total_reservas} reservas</span>
                                        </div>
                                    ))}
                                </div>
                                <div className=" top-list">
                                    <h4>Top Servicios</h4>
                                    {estadisticas.topServicios?.map((s: any, i: number) => (
                                        <div key={i} className="top-item">
                                            <span>{s.nombre}</span>
                                            <span>{s.total_reservas} reservas</span>
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
                                    <h4>{reserva.servicio_nombre}</h4>
                                    <p>Cliente: {reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                                    <p>Barbero: {reserva.barbero_nombre} {reserva.barbero_apellido}</p>
                                    <p>Fecha: {new Date(reserva.fecha_hora).toLocaleString()}</p>
                                    <p className={`estado estado-${reserva.estado}`}>Estado: {reserva.estado}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'barberos' && (
                <div>
                    <h3>Gestión de Barberos</h3>
                    {loading ? (
                        <SkeletonList count={4} />
                    ) : (
                        <div className="barberos-list">
                            {barberos.map(barbero => (
                                <div key={barbero.id} className="barbero-admin-card">
                                    <div className="barbero-info">
                                        <h4>{barbero.nombre} {barbero.apellido}</h4>
                                        <p>Email: {barbero.email}</p>
                                        <p>Estado: {barbero.estado}</p>
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
                    <h3>Gestión de Servicios</h3>
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
        </div>
    );
}
