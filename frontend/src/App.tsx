import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// URL base de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Interfaces TypeScript
interface User {
  id: number;
  stack_auth_id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: 'cliente' | 'barbero' | 'super_admin';
}

interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_min: number;
  activo?: boolean;
}

interface Barbero {
  id: number;
  usuario_id: number;
  turno_trabajo?: string;
  estado: string;
  experiencia_anios?: number;
  nombre: string;
  apellido: string;
  email: string;
}

interface Reserva {
  id: number;
  fecha_hora: string;
  estado: string;
  servicio_nombre: string;
  precio: number;
  barbero_nombre: string;
  barbero_apellido: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
}

interface Horario {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

type AdminSubView = 'reservas' | 'barberos' | 'servicios' | 'estadisticas';

// Configurar axios para incluir token JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Función para formatear fechas en zona horaria America/New York
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString));
};

function App() {
  // Estados globales
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [globalError, setGlobalError] = useState<string>('');

  // Estados para el flujo de reserva
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  // Estados para formularios
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<Barbero | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string>('');

  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Estados para sub-vistas
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('reservas');
  const [barberoSubView, setBarberoSubView] = useState<string>('reservas');

  // Estados para login/registro
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    nombre: '', apellido: '', telefono: '', email: '', password: '', confirmPassword: ''
  });

  // Cargar datos para landing
  useEffect(() => {
    loadLandingData();
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUserProfile();
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios/perfil`);
      setCurrentUser(response.data);
    } catch (err) {
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
    }
  };

  const loadLandingData = async () => {
    try {
      const [serviciosRes, barberosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/servicios`),
        axios.get(`${API_BASE_URL}/barberos`)
      ]);
      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);
    } catch (err) {
      console.error('Error cargando datos de landing:', err);
    }
  };

  const loadInitialData = async () => {
    try {
      const [serviciosRes, barberosRes, reservasRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/servicios`),
        axios.get(`${API_BASE_URL}/barberos`),
        currentUser?.rol === 'cliente' ? axios.get(`${API_BASE_URL}/reservas/mis`) :
        currentUser?.rol === 'barbero' ? axios.get(`${API_BASE_URL}/reservas/barberia`) :
        axios.get(`${API_BASE_URL}/reservas`)
      ]);

      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);
      setReservas(reservasRes.data);

      // Cargar estadísticas si es admin
      if (currentUser?.rol === 'super_admin') {
        const statsRes = await axios.get(`${API_BASE_URL}/estadisticas`);
        setEstadisticas(statsRes.data);
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  };

  // Funciones de autenticación con validaciones
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (!loginData.email.trim()) {
      setError('El email es obligatorio');
      setLoading(false);
      return;
    }

    if (!loginData.password.trim()) {
      setError('La contraseña es obligatoria');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      setError('Formato de email inválido');
      setLoading(false);
      return;
    }

    try {
      // Login con API local
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginData.email.trim(),
        password: loginData.password
      });

      const token = response.data.access_token;
      localStorage.setItem('auth_token', token);

      // Cargar perfil después del login
      await loadUserProfile();
      setCurrentView('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Registro con API local
      await axios.post(`${API_BASE_URL}/auth/register`, {
        name: `${registerData.nombre} ${registerData.apellido}`,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.telefono
      });

      // Después del registro, hacer login automático
      await handleLogin({ preventDefault: () => {} } as any);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en registro');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    setCurrentView('landing');
    setSelectedServicio(null);
    setSelectedBarbero(null);
    setSelectedHorario(null);
  };

  // Funciones del flujo de reserva
  const selectServicio = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setCurrentView('barberos');
  };

  const selectBarbero = (barbero: Barbero) => {
    setSelectedBarbero(barbero);
    setCurrentView('horarios');
  };

  const loadHorarios = async (fecha: string) => {
    if (!selectedBarbero) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/horarios/${selectedBarbero.id}/${fecha}`);
      setHorarios(response.data);
      setSelectedFecha(fecha);
    } catch (err) {
      console.error('Error cargando horarios:', err);
    }
  };

  const selectHorario = (horario: Horario) => {
    setSelectedHorario(horario);
    setCurrentView('confirmar');
  };

  const confirmarReserva = async () => {
    if (!selectedServicio || !selectedBarbero || !selectedHorario) return;

    try {
      setLoading(true);
      const fechaHora = `${selectedFecha}T${selectedHorario.hora_inicio}`;

      await axios.post(`${API_BASE_URL}/reservas`, {
        barbero_id: selectedBarbero.id,
        servicio_id: selectedServicio.id,
        fecha_hora: fechaHora
      });

      alert('Reserva creada exitosamente');
      setCurrentView('pago');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creando reserva');
    } finally {
      setLoading(false);
    }
  };

  const procesarPago = async (metodo: 'efectivo' | 'tarjeta') => {
    try {
      setLoading(true);
      // Obtener la última reserva del usuario (simplificado)
      const reservasRes = await axios.get(`${API_BASE_URL}/reservas/mis`);
      const ultimaReserva = reservasRes.data[0];

      await axios.post(`${API_BASE_URL}/pagos`, {
        reserva_id: ultimaReserva.id,
        metodo
      });

      alert('Pago procesado exitosamente');
      setCurrentView('dashboard');
      loadInitialData(); // Recargar datos
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId: number) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
      await axios.put(`${API_BASE_URL}/reservas/${reservaId}/cancelar`);
      alert('Reserva cancelada');
      loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error cancelando reserva');
    }
  };

  const reprogramarReserva = async (reserva: Reserva) => {
    const nuevaFecha = prompt('Ingresa la nueva fecha (YYYY-MM-DD):');
    const nuevaHora = prompt('Ingresa la nueva hora (HH:MM):');

    if (!nuevaFecha || !nuevaHora) return;

    const nuevaFechaHora = `${nuevaFecha}T${nuevaHora}`;

    try {
      await axios.put(`${API_BASE_URL}/reservas/${reserva.id}/reprogramar`, {
        nueva_fecha_hora: nuevaFechaHora
      });
      alert('Reserva reprogramada exitosamente');
      loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error reprogramando reserva');
    }
  };

  // Funciones de administración
  const editarBarbero = (barbero: Barbero) => {
    // Implementar edición de barbero
    alert('Funcionalidad de edición pendiente');
  };

  const eliminarBarbero = async (barberoId: number) => {
    if (!confirm('¿Estás seguro de desactivar este barbero?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/barberos/${barberoId}`);
      alert('Barbero desactivado');
      loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error desactivando barbero');
    }
  };

  const editarServicio = (servicio: Servicio) => {
    // Implementar edición de servicio
    alert('Funcionalidad de edición pendiente');
  };

  const eliminarServicio = async (servicioId: number) => {
    if (!confirm('¿Estás seguro de desactivar este servicio?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/servicios/${servicioId}`);
      alert('Servicio desactivado');
      loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error desactivando servicio');
    }
  };

  // Renderizado condicional
  if (!currentUser) {
    // Página de landing con login/registro
    return (
      <div className="landing-container">
        <header className="landing-header">
          <h1>Brookings Barber</h1>
          <div>
            <button onClick={() => setCurrentView('login')}>Iniciar Sesión</button>
            <button onClick={() => setCurrentView('register')}>Registrarse</button>
          </div>
        </header>

        {currentView === 'login' && (
          <div className="auth-modal">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
              {error && <div className="error">{error}</div>}
              <button type="submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        )}

        {currentView === 'register' && (
          <div className="auth-modal">
            <h2>Registrarse</h2>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Nombre"
                value={registerData.nombre}
                onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={registerData.apellido}
                onChange={(e) => setRegisterData({...registerData, apellido: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={registerData.telefono}
                onChange={(e) => setRegisterData({...registerData, telefono: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirmar Contraseña"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                required
              />
              {error && <div className="error">{error}</div>}
              <button type="submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Registrarse'}
              </button>
            </form>
          </div>
        )}

        {currentView === 'landing' && (
          <>
            <section className="hero">
              <h2>Estilo y Elegancia en Cada Corte</h2>
              <p>Reserva tu cita con los mejores barberos</p>
              <button onClick={() => setCurrentView('servicios')}>Reservar Cita</button>
            </section>

            <section className="servicios-preview">
              <h3>Nuestros Servicios</h3>
              <div className="servicios-grid">
                {servicios.slice(0, 3).map(servicio => (
                  <div key={servicio.id} className="servicio-card">
                    <h4>{servicio.nombre}</h4>
                    <p>${servicio.precio}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="barberos-preview">
              <h3>Nuestros Barberos</h3>
              <div className="barberos-grid">
                {barberos.slice(0, 3).map(barbero => (
                  <div key={barbero.id} className="barbero-card">
                    <h4>{barbero.nombre} {barbero.apellido}</h4>
                    <p>Experiencia: {barbero.experiencia_anios} años</p>
                    <p>Estado: {barbero.estado}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {currentView === 'servicios' && (
          <div className="servicios-page">
            <h2>Selecciona un Servicio</h2>
            <div className="servicios-grid">
              {servicios.map(servicio => (
                <div key={servicio.id} className="servicio-card" onClick={() => selectServicio(servicio)}>
                  <h4>{servicio.nombre}</h4>
                  <p>{servicio.descripcion}</p>
                  <p>${servicio.precio} - {servicio.duracion_min} minutos</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Usuario autenticado - Dashboard
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Brookings Barber</h1>
        <div className="user-info">
          <span>{currentUser.nombre} {currentUser.apellido}</span>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button onClick={() => setCurrentView('dashboard')}>Inicio</button>
        <button onClick={() => setCurrentView('reservar')}>Nueva Reserva</button>
        <button onClick={() => setCurrentView('reservas')}>Mis Reservas</button>
        {currentUser.rol === 'barbero' && <button onClick={() => setCurrentView('barbero')}>Panel Barbero</button>}
        {currentUser.rol === 'super_admin' && <button onClick={() => setCurrentView('admin')}>Panel Admin</button>}
      </nav>

      <main className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}
        {globalError && (
          <div className="global-error-banner">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError('')} className="error-close">×</button>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="dashboard-overview">
            <h2>Bienvenido, {currentUser.nombre}</h2>
            <div className="stats">
              <div className="stat-card">
                <h3>Reservas Activas</h3>
                <p>{reservas.filter(r => r.estado === 'confirmada').length}</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'reservar' && (
          <div className="reserva-flow">
            <h2>Nueva Reserva</h2>

            {!selectedServicio && (
              <div className="step">
                <h3>1. Selecciona un Servicio</h3>
                <div className="servicios-grid">
                  {servicios.map(servicio => (
                    <div key={servicio.id} className="servicio-card" onClick={() => selectServicio(servicio)}>
                      <h4>{servicio.nombre}</h4>
                      <p>{servicio.descripcion}</p>
                      <p>${servicio.precio} - {servicio.duracion_min}min</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedServicio && !selectedBarbero && (
              <div className="step">
                <h3>2. Selecciona un Barbero</h3>
                <div className="barberos-grid">
                  {barberos.map(barbero => (
                    <div key={barbero.id} className="barbero-card" onClick={() => selectBarbero(barbero)}>
                      <h4>{barbero.nombre} {barbero.apellido}</h4>
                      <p>Experiencia: {barbero.experiencia_anios} años</p>
                      <p>Estado: {barbero.estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBarbero && !selectedHorario && (
              <div className="step">
                <h3>3. Selecciona Fecha y Hora</h3>
                <input
                  type="date"
                  onChange={(e) => loadHorarios(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <div className="horarios-grid">
                  {horarios.filter(h => h.disponible).map(horario => (
                    <button
                      key={horario.id}
                      onClick={() => selectHorario(horario)}
                      className="horario-slot"
                    >
                      {horario.hora_inicio} - {horario.hora_fin}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedHorario && selectedServicio && selectedBarbero && (
              <div className="step">
                <h3>4. Confirmar Reserva</h3>
                <div className="reserva-summary">
                  <p><strong>Servicio:</strong> {selectedServicio.nombre}</p>
                  <p><strong>Barbero:</strong> {selectedBarbero.nombre} {selectedBarbero.apellido}</p>
                  <p><strong>Fecha:</strong> {selectedFecha}</p>
                  <p><strong>Hora:</strong> {selectedHorario.hora_inicio}</p>
                  <p><strong>Precio:</strong> ${selectedServicio.precio}</p>
                </div>
                <button onClick={confirmarReserva} disabled={loading}>
                  {loading ? 'Procesando...' : 'Confirmar Reserva'}
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'pago' && (
          <div className="pago-section">
            <h2>Procesar Pago</h2>
            <div className="pago-options">
              <button onClick={() => procesarPago('efectivo')} disabled={loading}>
                Pagar en Efectivo
              </button>
              <button onClick={() => procesarPago('tarjeta')} disabled={loading}>
                Pagar con Tarjeta
              </button>
            </div>
          </div>
        )}

        {currentView === 'reservas' && (
          <div className="reservas-section">
            <h2>Mis Reservas</h2>
            <div className="reservas-list">
              {reservas.map(reserva => (
                <div key={reserva.id} className="reserva-card">
                  <h4>{reserva.servicio_nombre}</h4>
                  <p>Barbero: {reserva.barbero_nombre} {reserva.barbero_apellido}</p>
                  <p>Fecha: {new Date(reserva.fecha_hora).toLocaleString()}</p>
                  <p>Estado: {reserva.estado}</p>
                  {reserva.estado === 'confirmada' && (
                    <div className="reserva-actions">
                      <button onClick={() => reprogramarReserva(reserva)}>Reprogramar</button>
                      <button onClick={() => cancelarReserva(reserva.id)}>Cancelar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'barbero' && currentUser.rol === 'barbero' && (
          <div className="barbero-panel">
            <h2>Panel de Barbero</h2>
            <div className="barbero-tabs">
              <button onClick={() => setBarberoSubView('reservas')}>Mis Reservas</button>
              <button onClick={() => setBarberoSubView('horarios')}>Gestionar Horarios</button>
            </div>

            {barberoSubView === 'reservas' && (
              <div>
                <h3>Mis Reservas</h3>
                <div className="reservas-list">
                  {reservas.map(reserva => (
                    <div key={reserva.id} className="reserva-card">
                      <h4>{reserva.servicio_nombre}</h4>
                      <p>Cliente: {reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                      <p>Fecha: {formatDate(reserva.fecha_hora)}</p>
                      <p>Estado: {reserva.estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {barberoSubView === 'horarios' && (
              <div>
                <h3>Gestionar Horarios de No Disponibilidad</h3>
                <div className="horarios-management">
                  <p>Funcionalidad para bloquear horarios específicos próximamente.</p>
                  <p>Por ahora, contacta al administrador para gestionar indisponibilidades.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'admin' && currentUser.rol === 'super_admin' && (
          <div className="admin-panel">
            <h2>Panel Super Admin</h2>
            <div className="admin-tabs">
              <button onClick={() => setAdminSubView('reservas')}>Reservas</button>
              <button onClick={() => setAdminSubView('barberos')}>Barberos</button>
              <button onClick={() => setAdminSubView('servicios')}>Servicios</button>
              <button onClick={() => setAdminSubView('estadisticas')}>Estadísticas</button>
            </div>

            {adminSubView === 'reservas' && (
              <div>
                <h3>Todas las Reservas</h3>
                <div className="reservas-list">
                  {reservas.map(reserva => (
                    <div key={reserva.id} className="reserva-card">
                      <h4>{reserva.servicio_nombre}</h4>
                      <p>Cliente: {reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                      <p>Barbero: {reserva.barbero_nombre} {reserva.barbero_apellido}</p>
                      <p>Fecha: {new Date(reserva.fecha_hora).toLocaleString()}</p>
                      <p>Estado: {reserva.estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSubView === 'barberos' && (
              <div>
                <h3>Gestión de Barberos</h3>
                <div className="admin-actions">
                  <button onClick={() => setCurrentView('crear-barbero')} className="btn btn-primary">
                    Crear Nuevo Barbero
                  </button>
                </div>
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
                        <button onClick={() => editarBarbero(barbero)} className="btn btn-secondary">
                          Editar
                        </button>
                        <button onClick={() => eliminarBarbero(barbero.id)} className="btn btn-danger">
                          Desactivar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {adminSubView === 'servicios' && (
              <div>
                <h3>Gestión de Servicios</h3>
                <div className="admin-actions">
                  <button onClick={() => setCurrentView('crear-servicio')} className="btn btn-primary">
                    Crear Nuevo Servicio
                  </button>
                </div>
                <div className="servicios-list">
                  {servicios.map(servicio => (
                    <div key={servicio.id} className="servicio-admin-card">
                      <div className="servicio-info">
                        <h4>{servicio.nombre}</h4>
                        <p>{servicio.descripcion}</p>
                        <p>Precio: ${servicio.precio}</p>
                        <p>Duración: {servicio.duracion_min} minutos</p>
                        <p>Estado: {servicio.activo ? 'Activo' : 'Inactivo'}</p>
                      </div>
                      <div className="servicio-actions">
                        <button onClick={() => editarServicio(servicio)} className="btn btn-secondary">
                          Editar
                        </button>
                        <button onClick={() => eliminarServicio(servicio.id)} className="btn btn-danger">
                          Desactivar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSubView === 'estadisticas' && estadisticas && (
              <div>
                <h3>Estadísticas y Reportes</h3>
                <div className="estadisticas-grid">
                  <div className="estadistica-card">
                    <h4>Total de Reservas</h4>
                    <p className="estadistica-numero">{estadisticas.totalReservas}</p>
                  </div>
                  <div className="estadistica-card">
                    <h4>Ingresos Totales</h4>
                    <p className="estadistica-numero">${estadisticas.ingresosTotales}</p>
                  </div>
                </div>

                <div className="estadisticas-section">
                  <h4>Servicios Más Populares</h4>
                  <div className="estadisticas-list">
                    {estadisticas.serviciosPopulares.map((servicio: any, index: number) => (
                      <div key={index} className="estadistica-item">
                        <span>{servicio.nombre}</span>
                        <span>{servicio.reservas} reservas</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="estadisticas-section">
                  <h4>Barberos Más Activos</h4>
                  <div className="estadisticas-list">
                    {estadisticas.barberosActivos.map((barbero: any, index: number) => (
                      <div key={index} className="estadistica-item">
                        <span>{barbero.nombre} {barbero.apellido}</span>
                        <span>{barbero.reservas} reservas</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;