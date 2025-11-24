// components/LandingPage.tsx - Página de aterrizaje ultra moderna
import { Servicio, Barbero } from './types';
import { SkeletonCard } from './Skeleton';
import './LandingPage.css';

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
            {/* Header Mejorado */}
            <header className="landing-header">
                <div className="header-content">
                    <h1 className="logo-text">Barbería UAN</h1>
                    <div className="header-actions">
                        <button className="btn-header-login" onClick={onLoginClick}>
                            Iniciar Sesión
                        </button>
                        <button className="btn-header-register" onClick={onRegisterClick}>
                            Registrarse
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section Ultra Mejorado */}
            <section className="hero-modern">
                <div className="hero-overlay"></div>
                <div className="hero-content-modern">
                    <div className="hero-text">
                        <span className="hero-badge">✂️ Profesionales Certificados</span>
                        <h2 className="hero-title">
                            Estilo Profesional,<br />
                            <span className="hero-title-gradient">Cortes Perfectos</span>
                        </h2>
                        <p className="hero-subtitle">
                            Experimenta el arte del barbering moderno. Nuestros expertos transforman tu imagen
                            con técnicas profesionales y atención personalizada.
                        </p>
                        <div className="hero-cta-group">
                            <button className="btn-cta-primary" onClick={onReservarClick}>
                                <span>Reservar Cita Ahora</span>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className="btn-cta-secondary" onClick={onLoginClick}>
                                Ver Disponibilidad
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Clientes Satisfechos</div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <div className="stat-number">10+</div>
                                <div className="stat-label">Años de Experiencia</div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <div className="stat-number">4.9★</div>
                                <div className="stat-label">Calificación Promedio</div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-images-modern">
                        <div className="hero-image-main-modern">
                            <img
                                src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
                                alt="Interior de barbería moderna"
                                className="main-image"
                            />
                            <div className="image-badge">
                                <span className="badge-icon">⭐</span>
                                <div className="badge-text">
                                    <div className="badge-title">Mejor Barbería</div>
                                    <div className="badge-subtitle">de la Ciudad 2024</div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-image-grid-modern">
                            <img
                                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80"
                                alt="Herramientas de barbería profesional"
                                className="grid-image"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80"
                                alt="Corte de cabello en proceso"
                                className="grid-image"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Servicios Section Mejorada */}
            <section className="servicios-modern">
                <div className="section-header">
                    <span className="section-badge">Nuestros Servicios</span>
                    <h3 className="section-title">Transforma Tu Estilo</h3>
                    <p className="section-subtitle">
                        Ofrecemos una amplia gama de servicios profesionales adaptados a tus necesidades
                    </p>
                </div>

                <div className="servicios-grid-modern">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        servicios.slice(0, 6).map(servicio => (
                            <div key={servicio.id} className="servicio-card-modern">
                                <div className="service-icon-modern">✂️</div>
                                <h4 className="service-name">{servicio.nombre}</h4>
                                <p className="service-description">{servicio.descripcion}</p>
                                <div className="service-footer">
                                    <div className="service-price">
                                        <span className="price-label">Desde</span>
                                        <span className="price-amount">${servicio.precio.toLocaleString()}</span>
                                    </div>
                                    <div className="service-duration">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M8 4V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        {servicio.duracion_min} min
                                    </div>
                                </div>
                                <button className="btn-service-book" onClick={onReservarClick}>
                                    Reservar
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Barberos Section Mejorada */}
            <section className="barberos-modern">
                <div className="section-header">
                    <span className="section-badge">Nuestro Equipo</span>
                    <h3 className="section-title">Expertos en Estilo</h3>
                    <p className="section-subtitle">
                        Profesionales certificados con años de experiencia y pasión por su trabajo
                    </p>
                </div>

                <div className="barberos-grid-modern">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        barberos.slice(0, 6).map(barbero => (
                            <div key={barbero.id} className="barbero-card-modern">
                                <div className="barber-image-wrapper">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${barbero.nombre}+${barbero.apellido}&background=1E3A5F&color=fff&size=200&bold=true`}
                                        alt={`${barbero.nombre} ${barbero.apellido}`}
                                        className="barber-image"
                                    />
                                    <div className={`barber-status ${barbero.estado === 'activo' ? 'status-active' : 'status-inactive'}`}>
                                        <div className="status-dot"></div>
                                        {barbero.estado === 'activo' ? 'Disponible' : 'No Disponible'}
                                    </div>
                                </div>
                                <div className="barber-info">
                                    <h4 className="barber-name">{barbero.nombre} {barbero.apellido}</h4>
                                    <div className="barber-details">
                                        <div className="detail-item">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M8 5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            <span>{barbero.experiencia_anios} años</span>
                                        </div>
                                        <div className="detail-item">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M2 6L8 2L14 6V12C14 12.5304 13.7893 13.0391 13.4142 13.4142C13.0391 13.7893 12.5304 14 12 14H4C3.46957 14 2.96086 13.7893 2.58579 13.4142C2.21071 13.0391 2 12.5304 2 12V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>{barbero.turno_trabajo || 'Completo'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Galería Section */}
            <section className="gallery-modern">
                <div className="section-header">
                    <span className="section-badge">Galería</span>
                    <h3 className="section-title">Nuestro Espacio</h3>
                    <p className="section-subtitle">Un ambiente moderno y profesional para tu mejor experiencia</p>
                </div>

                <div className="gallery-grid-modern">
                    <div className="gallery-item gallery-large">
                        <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80" alt="Barbería interior 1" />
                        <div className="gallery-overlay">
                            <span className="gallery-label">Interior Moderno</span>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80" alt="Estación de trabajo" />
                        <div className="gallery-overlay">
                            <span className="gallery-label">Estaciones Premium</span>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://www.treatwell.es/partners/wp-content/uploads/sites/16/2023/06/Captura-de-Pantalla-2023-06-26-a-las-13.38.03-1024x681.png" alt="Área de espera" />
                        <div className="gallery-overlay">
                            <span className="gallery-label">Área de Espera</span>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=400&q=80" alt="Herramientas profesionales" />
                        <div className="gallery-overlay">
                            <span className="gallery-label">Equipo Profesional</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="footer-cta">
                <div className="cta-content">
                    <h3>¿Listo Para Tu Transformación?</h3>
                    <p>Agenda tu cita hoy y descubre la diferencia de un servicio profesional</p>
                    <button className="btn-cta-large" onClick={onReservarClick}>
                        Reservar Mi Cita Ahora
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </section>
        </div>
    );
}
