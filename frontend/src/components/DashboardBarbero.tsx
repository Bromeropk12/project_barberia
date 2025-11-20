import React, { useState, useEffect } from 'react';
import { User, Reserva, Horario } from './types';
import { reservas, barberos, horarios } from '../api';
import './DashboardBarbero.css';

interface DashboardBarberoProps {
    user: User;
    onLogout: () => void;
}

const DashboardBarbero: React.FC<DashboardBarberoProps> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'reservas' | 'horario' | 'perfil'>('reservas');
    const [misReservas, setMisReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dailySlots, setDailySlots] = useState<Horario[]>([]);
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    // Profile state
    const [profileData, setProfileData] = useState({
        turno_trabajo: 'manana',
        experiencia_anios: 0,
        especialidades: ''
    });

    useEffect(() => {
        fetchReservas();
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'horario') {
            fetchHorarios(selectedDate);
        }
    }, [activeTab, selectedDate]);

    const fetchReservas = async () => {
        try {
            const response = await reservas.getBarberReservas();
            setMisReservas(response.data);
        } catch (error) {
            console.error('Error fetching reservas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            // We need to get the barber profile. 
            // Since we don't have a direct "get my barber profile" endpoint, 
            // we might need to rely on what we have or fetch all barberos and find ours.
            // For now, let's assume we can get it from the user object or a new call.
            // Actually, the user object has basic info. The barber specific info is in the 'barberos' table.
            // Let's fetch all barberos and filter by user.id (which is the usuario_id)
            const response = await barberos.getAll();
            const myBarberProfile = response.data.find(b => b.usuario_id === user.id);

            if (myBarberProfile) {
                setProfileData({
                    turno_trabajo: myBarberProfile.turno_trabajo || 'manana',
                    experiencia_anios: myBarberProfile.experiencia_anios || 0,
                    especialidades: myBarberProfile.especialidades || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchHorarios = async (fecha: string) => {
        try {
            // We need our barber ID.
            const response = await barberos.getAll();
            const myBarberProfile = response.data.find(b => b.usuario_id === user.id);

            if (myBarberProfile) {
                const slotsResponse = await barberos.getHorarios(myBarberProfile.id, fecha);
                setDailySlots(slotsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching horarios:', error);
        }
    };

    const handleCompleteReserva = async (id: number) => {
        if (window.confirm('¿Estás seguro de marcar esta reserva como completada?')) {
            try {
                await reservas.complete(id);
                fetchReservas();
                alert('Reserva completada exitosamente');
            } catch (error) {
                console.error('Error completing reserva:', error);
                alert('Error al completar la reserva');
            }
        }
    };

    const handleCancelReserva = async (id: number) => {
        if (window.confirm('¿Estás seguro de cancelar esta reserva? Esta acción notificará al cliente.')) {
            try {
                await reservas.cancelByBarber(id);
                fetchReservas();
                alert('Reserva cancelada exitosamente');
            } catch (error) {
                console.error('Error cancelling reserva:', error);
                alert('Error al cancelar la reserva');
            }
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await barberos.getAll();
            const myBarberProfile = response.data.find(b => b.usuario_id === user.id);

            if (myBarberProfile) {
                await barberos.update(myBarberProfile.id, {
                    ...profileData,
                    estado: myBarberProfile.estado // Keep existing status
                });
                alert('Perfil actualizado correctamente');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar el perfil');
        }
    };

    const handleToggleSlot = async (slot: Horario) => {
        try {
            await horarios.toggleAvailability(slot.id, !slot.disponible);
            fetchHorarios(selectedDate);
        } catch (error) {
            console.error('Error toggling slot:', error);
            alert('Error al modificar el horario');
        }
    };

    const handleGenerateHorarios = async () => {
        if (!fechaInicio || !fechaFin) {
            alert('Por favor selecciona fecha de inicio y fin');
            return;
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            alert('La fecha de inicio no puede ser posterior a la fecha de fin');
            return;
        }

        try {
            const response = await barberos.getAll();
            const myBarberProfile = response.data.find(b => b.usuario_id === user.id);

            if (myBarberProfile) {
                await horarios.generate({
                    barbero_id: myBarberProfile.id,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin
                });
                alert('Horarios generados exitosamente');
                fetchHorarios(selectedDate); // Refresh current date if it's in range
            }
        } catch (error) {
            console.error('Error generating horarios:', error);
            alert('Error al generar horarios');
        }
    };

    return (
        <div className="dashboard-barbero-container">
            <header className="dashboard-header">
                <div>
                    <h1>Panel de Barbero</h1>
                    <p>Bienvenido, {user.nombre}</p>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    Cerrar Sesión
                </button>
            </header>

            <div className="dashboard-tabs">
                <button
                    className={`tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reservas')}
                >
                    Mis Reservas
                </button>
                <button
                    className={`tab-button ${activeTab === 'horario' ? 'active' : ''}`}
                    onClick={() => setActiveTab('horario')}
                >
                    Mi Horario
                </button>
                <button
                    className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
                    onClick={() => setActiveTab('perfil')}
                >
                    Mi Perfil
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'reservas' && (
                    <div className="reservas-section">
                        <h2>Reservas Asignadas</h2>
                        {loading ? (
                            <p>Cargando reservas...</p>
                        ) : misReservas.length === 0 ? (
                            <p>No tienes reservas asignadas.</p>
                        ) : (
                            <div className="reservas-grid">
                                {misReservas.map((reserva) => (
                                    <div key={reserva.id} className="reserva-card">
                                        <div className="reserva-header">
                                            <span className="reserva-date">
                                                {new Date(reserva.fecha_hora).toLocaleDateString()} - {new Date(reserva.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={`reserva-status status-${reserva.estado}`}>
                                                {reserva.estado}
                                            </span>
                                        </div>
                                        <div className="reserva-details">
                                            <p><strong>Cliente:</strong> {reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                                            <p><strong>Servicio:</strong> {reserva.servicio_nombre}</p>
                                            <p><strong>Duración:</strong> {reserva.duracion_min} min</p>
                                            <p><strong>Precio:</strong> ${reserva.precio}</p>
                                            {reserva.telefono && <p><strong>Teléfono:</strong> {reserva.telefono}</p>}
                                        </div>
                                        {reserva.estado === 'confirmada' && (
                                            <div className="reserva-actions">
                                                <button
                                                    className="btn-action btn-complete"
                                                    onClick={() => handleCompleteReserva(reserva.id)}
                                                >
                                                    Completar
                                                </button>
                                                <button
                                                    className="btn-action btn-cancel"
                                                    onClick={() => handleCancelReserva(reserva.id)}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'horario' && (
                    <div className="horario-section">
                        <h2>Gestión de Horarios</h2>

                        <div className="generar-horarios-section">
                            <h3>Generar Horarios</h3>
                            <div className="generar-controls">
                                <div className="form-group">
                                    <label>Fecha Inicio:</label>
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha Fin:</label>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                    />
                                </div>
                                <button className="btn-generate" onClick={handleGenerateHorarios}>
                                    Generar Horarios
                                </button>
                            </div>
                        </div>

                        <div className="horario-controls">
                            <label>Seleccionar Fecha:</label>
                            <input
                                type="date"
                                className="date-picker"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="slots-grid">
                            {dailySlots.length > 0 ? (
                                dailySlots.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className={`time-slot ${slot.disponible ? 'available' : 'unavailable'}`}
                                        onClick={() => handleToggleSlot(slot)}
                                        title={slot.disponible ? 'Click para bloquear' : 'Click para desbloquear'}
                                    >
                                        {slot.hora_inicio.slice(0, 5)} - {slot.hora_fin.slice(0, 5)}
                                        <br />
                                        <small>{slot.disponible ? 'Disponible' : 'Bloqueado'}</small>
                                    </div>
                                ))
                            ) : (
                                <p>No hay horarios generados para esta fecha.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'perfil' && (
                    <div className="perfil-section">
                        <h2>Editar Perfil Profesional</h2>
                        <form className="profile-form" onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label>Turno de Trabajo</label>
                                <select
                                    value={profileData.turno_trabajo}
                                    onChange={(e) => setProfileData({ ...profileData, turno_trabajo: e.target.value })}
                                >
                                    <option value="manana">Mañana</option>
                                    <option value="tarde">Tarde</option>
                                    <option value="completo">Completo</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Años de Experiencia</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={profileData.experiencia_anios}
                                    onChange={(e) => setProfileData({ ...profileData, experiencia_anios: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Especialidades</label>
                                <textarea
                                    value={profileData.especialidades}
                                    onChange={(e) => setProfileData({ ...profileData, especialidades: e.target.value })}
                                    placeholder="Ej: Corte clásico, Barba, Degradado..."
                                />
                            </div>
                            <button type="submit" className="btn-save">Guardar Cambios</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardBarbero;
