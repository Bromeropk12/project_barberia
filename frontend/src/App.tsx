import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// URL base de la API
const API_URL = 'http://localhost:3000/api/usuarios';

// Interfaz TypeScript para Usuario
interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  contraseña: string;
  acepta_terminos: boolean;
  fecha_registro?: string;
}

// Interfaz para el formulario
interface FormData {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  contraseña: string;
  acepta_terminos: boolean;
}

// Interfaz para login
interface LoginData {
  usuario: string;
  password: string;
}

function App() {
  // Estados
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [loginData, setLoginData] = useState<LoginData>({
    usuario: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string>('');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    contraseña: '',
    acepta_terminos: false
  });
  const [mensaje, setMensaje] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Cargar usuarios al montar el componente si está logueado
  useEffect(() => {
    if (isLoggedIn) {
      obtenerUsuarios();
    }
  }, [isLoggedIn]);

  // Función para obtener todos los usuarios
  const obtenerUsuarios = async () => {
    try {
      const response = await axios.get<Usuario[]>(API_URL);
      setUsuarios(response.data);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError('Error al cargar los usuarios');
    }
  };

  // Manejar cambios en los inputs del formulario de usuario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Manejar cambios en los inputs del login
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };

  // Manejar login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginData.usuario === 'elsuperadmin' && loginData.password === 'yoeladmin852') {
      setIsLoggedIn(true);
      setShowLogin(false);
    } else {
      setLoginError('Credenciales incorrectas');
    }
  };

  // Manejar envío del formulario de usuario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    // Validaciones básicas
    if (!formData.nombre || !formData.apellido || !formData.telefono ||
        !formData.correo || !formData.contraseña) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!formData.acepta_terminos) {
      setError('Debe aceptar los términos y condiciones');
      return;
    }

    try {
      await axios.post(API_URL, formData);
      setMensaje('¡Usuario registrado exitosamente!');

      // Limpiar formulario
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
        correo: '',
        contraseña: '',
        acepta_terminos: false
      });

      // Recargar lista de usuarios
      obtenerUsuarios();
    } catch (err: any) {
      console.error('Error al crear usuario:', err);
      setError(err.response?.data?.error || 'Error al registrar usuario');
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje('Usuario eliminado correctamente');
      obtenerUsuarios();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar usuario');
    }
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogin(false);
    setLoginData({ usuario: '', password: '' });
    setLoginError('');
  };

  if (!isLoggedIn) {
    return (
      <div className="landing-container">
        {/* Header con botón de admin */}
        <header className="landing-header">
          <div className="logo">
            <h1>UAN Barber</h1>
          </div>
          <button className="btn-admin" onClick={() => setShowLogin(true)}>
            Panel de Administrador
          </button>
        </header>

        {/* Modal de login */}
        {showLogin && (
          <div className="modal-overlay" onClick={() => setShowLogin(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Acceso Administrador</h2>
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="usuario">Usuario:</label>
                  <input
                    type="text"
                    id="usuario"
                    name="usuario"
                    value={loginData.usuario}
                    onChange={handleLoginChange}
                    placeholder="Ingrese usuario"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Contraseña:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Ingrese contraseña"
                    required
                  />
                </div>
                {loginError && <div className="alert alert-error">{loginError}</div>}
                <div className="modal-buttons">
                  <button type="submit" className="btn btn-primary">Ingresar</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLogin(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h2>Estilo y Elegancia en Cada Corte</h2>
            <p>En UAN Barber, transformamos tu look con cortes modernos y servicios premium. ¡Visítanos y descubre la diferencia!</p>
            <button className="btn-cta">Agendar Cita</button>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Barbero trabajando" />
          </div>
        </section>

        {/* Servicios */}
        <section className="services">
          <h2>Nuestros Servicios</h2>
          <div className="services-grid">
            <div className="service-card">
              <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Corte de cabello" />
              <h3>Cortes Modernos</h3>
              <p>Cortes personalizados según tu estilo y personalidad.</p>
            </div>
            <div className="service-card">
              <img src="https://media.istockphoto.com/id/1973194125/es/foto/peluquero-que-da-forma-a-las-cejas-del-cliente-del-hombre-usando-la-maquinilla-de-afeitar-en.jpg?s=612x612&w=0&k=20&c=il7pTFcu-UQektvG-TS-_VlKfniY_m4r9zcmIgjRq-U=" alt="Afeitado" />
              <h3>Afeitado Clásico</h3>
              <p>Afeitado tradicional con navaja y productos premium.</p>
            </div>
            <div className="service-card">
              <img src="https://institutonoa.com.ar/wp-content/uploads/2021/10/barberia_.jpg" alt="Barba" />
              <h3>Cuidado de Barba</h3>
              <p>Recortes y tratamientos especializados para tu barba.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 UAN Barber. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  // Panel de administración (CRUD de usuarios)
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Panel de Administración - UAN Barber</h1>
        <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </header>

      <div className="content-wrapper">
        {/* Formulario de Registro */}
        <section className="form-section">
          <h2> Registrar Nuevo Usuario</h2>

          {mensaje && <div className="alert alert-success">{mensaje}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingrese su nombre"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido:</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ingrese su apellido"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono:</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="3001234567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo Electrónico:</label>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="usuario@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contraseña">Contraseña:</label>
              <input
                type="password"
                id="contraseña"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acepta_terminos"
                  checked={formData.acepta_terminos}
                  onChange={handleChange}
                />
                <span>Acepto los términos y condiciones</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary">
              ✅ Registrar Usuario
            </button>
          </form>
        </section>

        {/* Lista de Usuarios */}
        <section className="users-section">
          <h2>👥 Usuarios Registrados ({usuarios.length})</h2>

          {usuarios.length === 0 ? (
            <p className="no-users">No hay usuarios registrados aún</p>
          ) : (
            <div className="users-grid">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="user-card">
                  <div className="user-header">
                    <h3>{usuario.nombre} {usuario.apellido}</h3>
                    <span className="user-id">ID: {usuario.id}</span>
                  </div>
                  <div className="user-info">
                    <p><strong> Correo:</strong> {usuario.correo}</p>
                    <p><strong> Teléfono:</strong> {usuario.telefono}</p>
                    <p><strong> Términos:</strong> {usuario.acepta_terminos ? 'Aceptados' : 'No aceptados'}</p>
                  </div>
                  <button
                    onClick={() => eliminarUsuario(usuario.id)}
                    className="btn btn-danger"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;