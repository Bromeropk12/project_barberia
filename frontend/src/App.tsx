import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { useToast, ToastContainer } from './Toast';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { RegisterModal, RegisterData } from './components/RegisterModal';
import { DashboardCliente } from './components/DashboardCliente';
import { DashboardAdmin } from './components/DashboardAdmin';
import { ReservaFlow } from './components/ReservaFlow';
import { User, Servicio, Barbero, Reserva, Horario } from './components/types';

const API_BASE_URL = 'http://localhost:3000/api';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<Barbero | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    loadLandingData();
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUserProfile();
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios/perfil`);
      setCurrentUser(response.data);
      setCurrentView('dashboard');
    } catch (err) {
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
    }
  };

  const loadLandingData = async () => {
    try {
      setLoading(true);
      const [serviciosRes, barberosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/servicios`),
        axios.get(`${API_BASE_URL}/barberos`)
      ]);
      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [serviciosRes, barberosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/servicios`),
        axios.get(`${API_BASE_URL}/barberos`)
      ]);
      setServicios(serviciosRes.data);
      setBarberos(barberosRes.data);

      if (currentUser?.rol === 'cliente') {
        const reservasRes = await axios.get(`${API_BASE_URL}/reservas/mis`);
        setReservas(reservasRes.data);
      } else if (currentUser?.rol === 'super_admin') {
        const [reservasRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/reservas`),
          axios.get(`${API_BASE_URL}/estadisticas`)
        ]);
        setReservas(reservasRes.data);
        setEstadisticas(statsRes.data);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      toast.error('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Formato de email inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem('auth_token', response.data.access_token);
      setCurrentUser(response.data.user);
      setShowLogin(false);
      setCurrentView('dashboard');
      toast.success('¡Bienvenido!', `Hola ${response.data.user.nombre}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMsg);
      toast.error('Error de autenticación', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setLoading(true);
    setError('');

    if (!data.nombre.trim() || !data.apellido.trim() || !data.email.trim() || !data.password.trim()) {
      setError('Nombre, apellido, email y contraseña son obligatorios');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setError('Formato de email inválido');
      setLoading(false);
      return;
    }

    if (data.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        name: `${data.nombre} ${data.apellido}`,
        email: data.email,
        password: data.password,
        phone: data.telefono
      });

      setShowRegister(false);
      toast.success('¡Cuenta creada!', 'Ahora inicia sesión');
      await handleLogin(data.email, data.password);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al registrarse';
      setError(errorMsg);
      toast.error('Error de registro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    setCurrentView('landing');
    toast.info('Sesión cerrada', 'Hasta pronto');
  };

  const handleSelectServicio = (servicio: Servicio) => {
    setSelectedServicio(servicio);
  };

  const handleSelectBarbero = (barbero: Barbero) => {
    setSelectedBarbero(barbero);
  };

  const handleLoadHorarios = async (fecha: string) => {
    if (!selectedBarbero) return;

    setSelectedFecha(fecha);
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/horarios/${selectedBarbero.id}/${fecha}`
      );
      setHorarios(response.data);
    } catch (err) {
      toast.error('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHorario = (horario: Horario) => {
    setSelectedHorario(horario);
  };

  const handleConfirmarReserva = async () => {
    if (!selectedServicio || !selectedBarbero || !selectedHorario) {
      toast.warning('Datos incompletos', 'Por favor completa todos los pasos');
      return;
    }

    setLoading(true);
    try {
      const fechaHora = `${selectedFecha}T${selectedHorario.hora_inicio}`;
      await axios.post(`${API_BASE_URL}/reservas`, {
        servicio_id: selectedServicio.id,
        barbero_id: selectedBarbero.id,
        fecha_hora: fechaHora
      });

      toast.success('¡Reserva confirmada!', 'Tu cita ha sido agendada exitosamente');

      setSelectedServicio(null);
      setSelectedBarbero(null);
      setSelectedHorario(null);
      setSelectedFecha('');
      setCurrentView('dashboard');

      loadUserData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al crear reserva';
      toast.error('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async (id: number) => {
    if (!window.confirm('¿Estás seguro de cancelar esta reserva?')) return;

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/reservas/${id}/cancelar`);
      toast.success('Reserva cancelada', 'La reserva ha sido cancelada');
      loadUserData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al cancelar';
      toast.error('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReprogramarReserva = () => {
    toast.info('Reprogramar', 'Funcionalidad en desarrollo');
  };

  const handleEliminarBarbero = async (id: number) => {
    if (!window.confirm('¿Desactivar este barbero?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/barberos/${id}`);
      toast.success('Barbero desactivado', 'El barbero ha sido desactivado');
      loadUserData();
    } catch (err: any) {
      toast.error('Error', 'No se pudo desactivar el barbero');
    }
  };

  const handleEliminarServicio = async (id: number) => {
    if (!window.confirm('¿Desactivar este servicio?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/servicios/${id}`);
      toast.success('Servicio desactivado', 'El servicio ha sido desactivado');
      loadUserData();
    } catch (err: any) {
      toast.error('Error', 'No se pudo desactivar el servicio');
    }
  };

  return (
    <div className="App">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {currentUser && (
        <header className="app-header">
          <h1>Barbería UAN</h1>
          <nav>
            <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
            {currentUser.rol === 'cliente' && (
              <button onClick={() => setCurrentView('reservar')}>Nueva Reserva</button>
            )}
            <span>Hola, {currentUser.nombre}</span>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </header>
      )}

      {currentView === 'landing' && (
        <LandingPage
          servicios={servicios}
          barberos={barberos}
          loading={loading}
          onLoginClick={() => setShowLogin(true)}
          onRegisterClick={() => setShowRegister(true)}
          onReservarClick={() => {
            if (currentUser) {
              setCurrentView('reservar');
            } else {
              setShowLogin(true);
            }
          }}
        />
      )}

      {currentView === 'dashboard' && currentUser?.rol === 'cliente' && (
        <DashboardCliente
          reservas={reservas}
          loading={loading}
          onCancelar={handleCancelarReserva}
          onReprogramar={handleReprogramarReserva}
        />
      )}

      {currentView === 'dashboard' && currentUser?.rol === 'super_admin' && (
        <DashboardAdmin
          reservas={reservas}
          barberos={barberos}
          servicios={servicios}
          estadisticas={estadisticas}
          loading={loading}
          onEliminarBarbero={handleEliminarBarbero}
          onEliminarServicio={handleEliminarServicio}
        />
      )}

      {currentView === 'reservar' && currentUser && (
        <ReservaFlow
          servicios={servicios}
          barberos={barberos}
          horarios={horarios}
          loading={loading}
          onSelectServicio={handleSelectServicio}
          onSelectBarbero={handleSelectBarbero}
          onLoadHorarios={handleLoadHorarios}
          onSelectHorario={handleSelectHorario}
          onConfirmar={handleConfirmarReserva}
          selectedServicio={selectedServicio}
          selectedBarbero={selectedBarbero}
          selectedHorario={selectedHorario}
          selectedFecha={selectedFecha}
        />
      )}

      {showLogin && (
        <LoginModal
          onSubmit={handleLogin}
          onClose={() => {
            setShowLogin(false);
            setError('');
          }}
          loading={loading}
          error={error}
        />
      )}

      {showRegister && (
        <RegisterModal
          onSubmit={handleRegister}
          onClose={() => {
            setShowRegister(false);
            setError('');
          }}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}

export default App;