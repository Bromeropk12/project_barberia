// components/LandingPage.tsx
import { Servicio, Barbero } from './types';
import { SkeletonCard } from './Skeleton';

interface LandingPageProps {
    servicios: Servicio[];
    barberos: Barbero[];
    loading: boolean;
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onReservarClick: () => void;
}

export function LandingPage({
    servicios,
    barberos,
    loading,
    onLoginClick,
    onRegisterClick,
    onReservarClick
}: LandingPageProps) {
    return (
        <div className="landing-container">
            <header className="landing-header">
                <h1>Barbería UAN</h1>
                <div>
                    <button onClick={onLoginClick}>Iniciar Sesión</button>
                    <button onClick={onRegisterClick}>Registrarse</button>
                </div>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h2>Estilo Profesional<br />Cortes Perfectos</h2>
                    <p>Experimenta el arte del barbering moderno con nuestros expertos. Agenda tu cita hoy y descubre tu mejor versión.</p>
                    <button onClick={onReservarClick}>Reservar Cita Ahora</button>
                </div>
            </section>

            <section className="servicios-preview">
                <h3>Nuestros Servicios</h3>
                <div className="servicios-grid">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        servicios.slice(0, 6).map(servicio => (
                            <div key={servicio.id} className="servicio-card">
                                <div className="service-icon">✂️</div>
                                <h4>{servicio.nombre}</h4>
                                <p>{servicio.descripcion}</p>
                                <p className="precio">${servicio.precio.toLocaleString()}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {servicio.duracion_min} minutos
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="barberos-preview">
                <h3>Nuestro Equipo</h3>
                <div className="barberos-grid">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        barberos.slice(0, 6).map(barbero => (
                            <div key={barbero.id} className="barbero-card">
                                <div className="barber-avatar">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${barbero.nombre}+${barbero.apellido}&background=0A84FF&color=fff&size=128`}
                                        alt={`${barbero.nombre} ${barbero.apellido}`}
                                    />
                                </div>
                                <h4>{barbero.nombre} {barbero.apellido}</h4>
                                <p>Experiencia: {barbero.experiencia_anios} años</p>
                                <p>Turno: {barbero.turno_trabajo || 'Completo'}</p>
                                <p style={{
                                    marginTop: '0.75rem',
                                    color: barbero.estado === 'activo' ? 'var(--success)' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}>
                                    {barbero.estado === 'activo' ? '● Disponible' : 'No disponible'}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
