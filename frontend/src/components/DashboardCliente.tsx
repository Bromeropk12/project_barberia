// components/DashboardCliente.tsx - Client dashboard component
import { Reserva } from './types';
import { SkeletonList } from './Skeleton';

interface DashboardClienteProps {
    reservas: Reserva[];
    loading: boolean;
    onCancelar: (id: number) => void;
    onReprogramar: (reserva: Reserva) => void;
}

export function DashboardCliente({
    reservas,
    loading,
    onCancelar,
    onReprogramar
}: DashboardClienteProps) {
    return (
        <div className="dashboard-overview">
            <h2>Mis Reservas</h2>

            <div className="stats">
                <div className="stat-card">
                    <h3>Reservas Activas</h3>
                    <p>{reservas.filter(r => r.estado === 'confirmada').length}</p>
                </div>
            </div>

            <div className="reservas-section">
                <h3>Historial de Reservas</h3>
                <div className="reservas-list">
                    {loading ? (
                        <SkeletonList count={3} />
                    ) : reservas.length === 0 ? (
                        <p className="no-data">No tienes reservas aún</p>
                    ) : (
                        reservas.map(reserva => (
                            <div key={reserva.id} className="reserva-card">
                                <h4>{reserva.servicio_nombre}</h4>
                                <p>Barbero: {reserva.barbero_nombre} {reserva.barbero_apellido}</p>
                                <p>Fecha: {new Date(reserva.fecha_hora).toLocaleString()}</p>
                                <p>Precio: ${reserva.precio.toLocaleString()}</p>
                                <p className={`estado estado-${reserva.estado}`}>
                                    Estado: {reserva.estado}
                                </p>
                                {reserva.estado === 'confirmada' && (
                                    <div className="reserva-actions">
                                        <button
                                            onClick={() => onReprogramar(reserva)}
                                            className="btn-secondary"
                                        >
                                            Reprogramar
                                        </button>
                                        <button
                                            onClick={() => onCancelar(reserva.id)}
                                            className="btn-danger"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
