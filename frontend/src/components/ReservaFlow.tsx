// components/ReservaFlow.tsx - Componente de flujo de reserva
import { Servicio, Barbero, Horario } from './types';
import { SkeletonCard } from './Skeleton';
import './ReservaFlow.css';

interface ReservaFlowProps {
    servicios: Servicio[];
    barberos: Barbero[];
    horarios: Horario[];
    loading: boolean;
    onSelectServicio: (servicio: Servicio) => void;
    onSelectBarbero: (barbero: Barbero) => void;
    onLoadHorarios: (fecha: string) => void;
    onSelectHorario: (horario: Horario) => void;
    onConfirmar: () => void;
    selectedServicio: Servicio | null;
    selectedBarbero: Barbero | null;
    selectedHorario: Horario | null;
    selectedFecha: string;
}

export function ReservaFlow({
    servicios,
    barberos,
    horarios,
    loading,
    onSelectServicio,
    onSelectBarbero,
    onLoadHorarios,
    onSelectHorario,
    onConfirmar,
    selectedServicio,
    selectedBarbero,
    selectedHorario,
    selectedFecha
}: ReservaFlowProps) {
    const handleCancelar = () => {
        if (window.confirm('¿Estás seguro de cancelar esta reserva? Se perderá toda la información.')) {
            // Usar window.location para forzar recarga y limpiar estado
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="reserva-flow">
            <h2>Nueva Reserva</h2>

            {/* Paso 1: Seleccionar Servicio */}
            {!selectedServicio && (
                <div className="step">
                    <div className="step-header">
                        <h3>1. Selecciona un Servicio</h3>
                        <button onClick={handleCancelar} className="btn-secondary btn-sm">
                            ❌ Cancelar
                        </button>
                    </div>
                    <div className="servicios-grid">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : (
                            servicios.map(servicio => (
                                <div
                                    key={servicio.id}
                                    className="servicio-card clickable"
                                    onClick={() => onSelectServicio(servicio)}
                                >
                                    <h4>{servicio.nombre}</h4>
                                    <p>{servicio.descripcion}</p>
                                    <p className="precio">${servicio.precio.toLocaleString()}</p>
                                    <p className="duracion">{servicio.duracion_min} minutos</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Paso 2: Seleccionar Barbero */}
            {selectedServicio && !selectedBarbero && (
                <div className="step">
                    <div className="step-header">
                        <h3>2. Selecciona un Barbero</h3>
                        <button onClick={handleCancelar} className="btn-secondary btn-sm">
                            ❌ Cancelar Reserva
                        </button>
                    </div>
                    <div className="barberos-grid">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : (
                            barberos.map(barbero => (
                                <div
                                    key={barbero.id}
                                    className="barbero-card clickable"
                                    onClick={() => onSelectBarbero(barbero)}
                                >
                                    <h4>{barbero.nombre} {barbero.apellido}</h4>
                                    <p>Experiencia: {barbero.experiencia_anios} años</p>
                                    <p>Estado: {barbero.estado}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Paso 3: Seleccionar Fecha y Hora */}
            {selectedBarbero && !selectedHorario && (
                <div className="step">
                    <div className="step-header">
                        <h3>3. Selecciona Fecha y Hora</h3>
                        <button onClick={handleCancelar} className="btn-secondary btn-sm">
                            ❌ Cancelar Reserva
                        </button>
                    </div>
                    <input
                        type="date"
                        onChange={(e) => onLoadHorarios(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="fecha-input"
                    />
                    {selectedFecha && (
                        <div className="horarios-grid">
                            {horarios.length > 0 ? (
                                horarios.map(horario => (
                                    <button
                                        key={horario.id}
                                        onClick={() => horario.disponible && onSelectHorario(horario)}
                                        className={`horario-slot ${horario.disponible ? 'disponible' : 'no-disponible'}`}
                                        disabled={!horario.disponible}
                                    >
                                        {horario.hora_inicio} - {horario.hora_fin}
                                    </button>
                                ))
                            ) : (
                                <p>No hay horarios para esta fecha</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Paso 4: Confirmar Reserva */}
            {selectedHorario && selectedServicio && selectedBarbero && (
                <div className="step">
                    <h3>4. Confirmar Reserva</h3>
                    <div className="reserva-summary">
                        <p><strong>Servicio:</strong> {selectedServicio.nombre}</p>
                        <p><strong>Barbero:</strong> {selectedBarbero.nombre} {selectedBarbero.apellido}</p>
                        <p><strong>Fecha:</strong> {selectedFecha}</p>
                        <p><strong>Hora:</strong> {selectedHorario.hora_inicio}</p>
                        <p><strong>Precio:</strong> ${selectedServicio.precio.toLocaleString()}</p>
                    </div>
                    <div className="action-buttons">
                        <button
                            onClick={handleCancelar}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            ❌ Cancelar
                        </button>
                        <button
                            onClick={onConfirmar}
                            disabled={loading}
                            className="btn-primary btn-large"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Reserva'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
