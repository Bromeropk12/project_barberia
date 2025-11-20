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

// Configurar axios para incluir token JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  // Estados globales
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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

  // Estados para sub-vistas
  const [adminSubView, setAdminSubView] = useState<string>('reservas');

  // Estados para login/registro
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    nombre: '', apellido: '', telefono: '', email: '', password: '', confirmPassword: ''
  });

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
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  };

  // Funciones de autenticación (simuladas para Stack Auth)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Aquí iría la integración real con Stack Auth
      // Por ahora, simulamos con un token hardcodeado
      const mockToken = 'mock_jwt_token_for_development';
      localStorage.setItem('auth_token', mockToken);

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
      // Aquí iría el registro con Stack Auth
      alert('Registro simulado - En producción usarías Stack Auth');
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
                    <button onClick={() => cancelarReserva(reserva.id)}>Cancelar</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'barbero' && currentUser.rol === 'barbero' && (
          <div className="barbero-panel">
            <h2>Panel de Barbero</h2>
            <h3>Mis Reservas</h3>
            <div className="reservas-list">
              {reservas.map(reserva => (
                <div key={reserva.id} className="reserva-card">
                  <h4>{reserva.servicio_nombre}</h4>
                  <p>Cliente: {reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                  <p>Fecha: {new Date(reserva.fecha_hora).toLocaleString()}</p>
                  <p>Estado: {reserva.estado}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'admin' && currentUser.rol === 'super_admin' && (
          <div className="admin-panel">
            <h2>Panel Super Admin</h2>
            <div className="admin-tabs">
              <button onClick={() => setAdminSubView('reservas')}>Reservas</button>
              <button onClick={() => setAdminSubView('barberos')}>Barberos</button>
              <button onClick={() => setAdminSubView('servicios')}>Servicios</button>
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

            {adminSubView === 'barberos' && <div><h3>Gestión de Barberos</h3><p>Funcionalidad pendiente...</p></div>}
            {adminSubView === 'servicios' && <div><h3>Gestión de Servicios</h3><p>Funcionalidad pendiente...</p></div>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;