import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './database';
import { authenticateToken, requireRole } from './auth';
import { enviarConfirmacionReserva, enviarCancelacionReserva } from './emailService';
import { iniciarRecordatorios } from './reminderService';

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON en el body

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ mensaje: 'API de Brookings Barber funcionando correctamente' });
});

// ===== ENDPOINTS DE AUTENTICACIÓN =====

// POST - Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Buscar usuario
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Método de autenticación no válido' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido
      },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST - Registro
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Separar nombre y apellido
    const nameParts = name.split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    // Crear usuario
    const result = await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, passwordHash, nombre, apellido, phone || null, 'cliente']
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        nombre: result.rows[0].nombre,
        apellido: result.rows[0].apellido,
        rol: result.rows[0].rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ===== ENDPOINTS DE USUARIOS =====

// GET - Obtener perfil del usuario autenticado
app.get('/api/usuarios/perfil', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT - Actualizar perfil del usuario
app.put('/api/usuarios/perfil', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, telefono } = req.body;
    const userId = req.user!.id;

    const result = await pool.query(
      'UPDATE usuarios SET nombre = $1, apellido = $2, telefono = $3 WHERE id = $4 RETURNING *',
      [nombre, apellido, telefono, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// GET - Listar todos los usuarios (solo super_admin)
app.get('/api/usuarios', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, email, nombre, apellido, telefono, rol, fecha_registro FROM usuarios ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PUT - Cambiar rol de usuario (solo super_admin)
app.put('/api/usuarios/:id/rol', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!['cliente', 'barbero', 'super_admin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const result = await pool.query(
      'UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING *',
      [rol, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
});

// ===== ENDPOINTS DE SERVICIOS =====

// GET - Listar servicios activos
app.get('/api/servicios', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM servicios WHERE activo = true ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// POST - Crear servicio (solo super_admin)
app.post('/api/servicios', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, precio, duracion_min } = req.body;

    if (!nombre || !precio || !duracion_min) {
      return res.status(400).json({ error: 'Nombre, precio y duración son obligatorios' });
    }

    if (precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a cero' });
    }

    if (duracion_min <= 0) {
      return res.status(400).json({ error: 'La duración debe ser mayor a cero' });
    }

    const result = await pool.query(
      'INSERT INTO servicios (nombre, descripcion, precio, duracion_min) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion, precio, duracion_min]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// PUT - Actualizar servicio (solo super_admin)
app.put('/api/servicios/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracion_min, activo } = req.body;

    if (precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a cero' });
    }

    if (duracion_min <= 0) {
      return res.status(400).json({ error: 'La duración debe ser mayor a cero' });
    }

    const result = await pool.query(
      'UPDATE servicios SET nombre = $1, descripcion = $2, precio = $3, duracion_min = $4, activo = $5 WHERE id = $6 RETURNING *',
      [nombre, descripcion, precio, duracion_min, activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// DELETE - Desactivar servicio (solo super_admin)
app.delete('/api/servicios/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE servicios SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ mensaje: 'Servicio desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar servicio:', error);
    res.status(500).json({ error: 'Error al desactivar servicio' });
  }
});

// ===== ENDPOINTS DE BARBEROS =====

// GET - Listar barberos activos
app.get('/api/barberos', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.nombre, u.apellido, u.email, u.telefono
      FROM barberos b
      JOIN usuarios u ON b.usuario_id = u.id
      WHERE b.estado != 'inactivo'
      ORDER BY b.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener barberos:', error);
    res.status(500).json({ error: 'Error al obtener barberos' });
  }
});

// POST - Registrar nuevo barbero completo (Admin)
app.post('/api/admin/barberos/register', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, email, password, phone, turno_trabajo, experiencia_anios, especialidades } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    // 1. Verificar usuario existente
    const existingUser = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // 2. Crear Usuario
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const nameParts = name.split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    const userResult = await client.query(
      'INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [email, passwordHash, nombre, apellido, phone || null, 'barbero']
    );
    const userId = userResult.rows[0].id;

    // 3. Crear Perfil Barbero
    await client.query(
      'INSERT INTO barberos (usuario_id, turno_trabajo, experiencia_anios, especialidades) VALUES ($1, $2, $3, $4)',
      [userId, turno_trabajo || 'manana', experiencia_anios || 0, especialidades || 'General']
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Barbero registrado exitosamente',
      credentials: { email, password }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar barbero:', error);
    res.status(500).json({ error: 'Error al registrar barbero' });
  } finally {
    client.release();
  }
});

// POST - Crear barbero (solo super_admin) - Legacy (usa usuario existente)
app.post('/api/barberos', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { usuario_id, turno_trabajo, experiencia_anios, especialidades } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ error: 'Usuario es obligatorio' });
    }

    // Verificar que el usuario existe y no es ya barbero
    const userCheck = await pool.query('SELECT * FROM usuarios WHERE id = $1', [usuario_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const barberoCheck = await pool.query('SELECT * FROM barberos WHERE usuario_id = $1', [usuario_id]);
    if (barberoCheck.rows.length > 0) {
      return res.status(409).json({ error: 'El usuario ya es barbero' });
    }

    const result = await pool.query(
      'INSERT INTO barberos (usuario_id, turno_trabajo, experiencia_anios, especialidades) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario_id, turno_trabajo, experiencia_anios, especialidades]
    );

    // Actualizar rol del usuario a barbero
    await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', ['barbero', usuario_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear barbero:', error);
    res.status(500).json({ error: 'Error al crear barbero' });
  }
});


// DELETE - Desactivar barbero (solo super_admin)
app.delete('/api/barberos/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el barbero existe
    const barberoCheck = await pool.query('SELECT usuario_id FROM barberos WHERE id = $1', [id]);
    if (barberoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    // Cambiar estado a inactivo en lugar de eliminar
    await pool.query('UPDATE barberos SET estado = $1 WHERE id = $2', ['inactivo', id]);

    // Nota: Mantener rol como 'barbero' para preservar historial, pero estado inactivo impide operaciones

    res.json({ mensaje: 'Barbero desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar barbero:', error);
    res.status(500).json({ error: 'Error al desactivar barbero' });
  }
});

// PUT - Actualizar barbero (super_admin o el propio barbero)
app.put('/api/barberos/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { turno_trabajo, estado, experiencia_anios, especialidades } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.rol;

    // Verificar permisos
    const barberoResult = await pool.query('SELECT * FROM barberos WHERE id = $1', [id]);
    if (barberoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    if (barberoResult.rows[0].estado === 'inactivo') {
      return res.status(409).json({ error: 'No se puede modificar un barbero inactivo' });
    }

    if (userRole !== 'super_admin' && barberoResult.rows[0].usuario_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este barbero' });
    }

    const result = await pool.query(
      'UPDATE barberos SET turno_trabajo = $1, estado = $2, experiencia_anios = $3, especialidades = $4 WHERE id = $5 RETURNING *',
      [turno_trabajo, estado, experiencia_anios, especialidades, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar barbero:', error);
    res.status(500).json({ error: 'Error al actualizar barbero' });
  }
});

// ===== ENDPOINTS DE HORARIOS =====

// GET - Obtener horarios disponibles de un barbero en una fecha
app.get('/api/horarios/:barberoId/:fecha', async (req: Request, res: Response) => {
  try {
    const { barberoId, fecha } = req.params;

    const result = await pool.query(
      'SELECT * FROM horarios WHERE barbero_id = $1 AND fecha = $2 AND disponible = true ORDER BY hora_inicio',
      [barberoId, fecha]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

// POST - Generar horarios para un barbero (super_admin o barbero)
app.post('/api/horarios/generar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { barbero_id, fecha_inicio, fecha_fin } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.rol;

    // Verificar permisos
    if (userRole !== 'super_admin') {
      const barberoCheck = await pool.query('SELECT * FROM barberos WHERE id = $1 AND usuario_id = $2', [barbero_id, userId]);
      if (barberoCheck.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permisos para gestionar este barbero' });
      }
    }

    // Llamar función de BD para generar horarios
    await pool.query('SELECT generar_horarios_barbero($1, $2, $3)', [barbero_id, fecha_inicio, fecha_fin]);

    res.json({ mensaje: 'Horarios generados correctamente' });
  } catch (error) {
    console.error('Error al generar horarios:', error);
    res.status(500).json({ error: 'Error al generar horarios' });
  }
});

// PUT - Bloquear/desbloquear horario (barbero)
app.put('/api/horarios/:id/disponibilidad', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { disponible } = req.body;
    const userId = req.user!.id;

    // Verificar que el horario pertenece al barbero
    const horarioResult = await pool.query(`
      SELECT h.* FROM horarios h
      JOIN barberos b ON h.barbero_id = b.id
      WHERE h.id = $1 AND b.usuario_id = $2
    `, [id, userId]);

    if (horarioResult.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este horario' });
    }

    const result = await pool.query(
      'UPDATE horarios SET disponible = $1 WHERE id = $2 RETURNING *',
      [disponible, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    res.status(500).json({ error: 'Error al actualizar disponibilidad' });
  }
});

// ===== ENDPOINTS DE RESERVAS =====

// GET - Mis reservas (cliente)
app.get('/api/reservas/mis', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(`
      SELECT r.*, s.nombre as servicio_nombre, s.precio, s.duracion_min,
             b.id as barbero_id, u.nombre as barbero_nombre, u.apellido as barbero_apellido
      FROM reservas r
      JOIN servicios s ON r.servicio_id = s.id
      JOIN barberos b ON r.barbero_id = b.id
      JOIN usuarios u ON b.usuario_id = u.id
      WHERE r.usuario_id = $1
      ORDER BY r.fecha_hora DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// GET - Reservas de mi barbería (barbero)
app.get('/api/reservas/barberia', authenticateToken, requireRole(['barbero']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(`
      SELECT r.*, s.nombre as servicio_nombre, s.precio, s.duracion_min,
             u.nombre as cliente_nombre, u.apellido as cliente_apellido, u.telefono
      FROM reservas r
      JOIN servicios s ON r.servicio_id = s.id
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.barbero_id = (SELECT id FROM barberos WHERE usuario_id = $1)
      ORDER BY r.fecha_hora DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reservas de barbería:', error);
    res.status(500).json({ error: 'Error al obtener reservas de barbería' });
  }
});

// GET - Todas las reservas (super_admin)
app.get('/api/reservas', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, s.nombre as servicio_nombre, s.precio,
             b.id as barbero_id, ub.nombre as barbero_nombre, ub.apellido as barbero_apellido,
             uc.nombre as cliente_nombre, uc.apellido as cliente_apellido
      FROM reservas r
      JOIN servicios s ON r.servicio_id = s.id
      JOIN barberos b ON r.barbero_id = b.id
      JOIN usuarios ub ON b.usuario_id = ub.id
      JOIN usuarios uc ON r.usuario_id = uc.id
      ORDER BY r.fecha_hora DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener todas las reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// POST - Crear reserva
app.post('/api/reservas', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { barbero_id, servicio_id, fecha_hora } = req.body;
    const userId = req.user!.id;

    if (!barbero_id || !servicio_id || !fecha_hora) {
      return res.status(400).json({ error: 'Barbero, servicio y fecha/hora son obligatorios' });
    }

    // Verificar que la fecha no es en el pasado
    const fechaReserva = new Date(fecha_hora);
    const ahora = new Date();
    if (fechaReserva <= ahora) {
      return res.status(400).json({ error: 'No se pueden hacer reservas en fechas pasadas' });
    }

    // Verificar que el barbero existe y está disponible
    const barberoResult = await pool.query('SELECT * FROM barberos WHERE id = $1', [barbero_id]);
    if (barberoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }
    if (barberoResult.rows[0].estado === 'inactivo') {
      return res.status(409).json({ error: 'El barbero no está disponible' });
    }

    // Obtener datos del servicio
    const serviceResult = await pool.query('SELECT * FROM servicios WHERE id = $1', [servicio_id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    const servicio = serviceResult.rows[0];
    const numSlots = Math.ceil(servicio.duracion_min / 30.0);

    // Verificar que todos los slots necesarios están disponibles
    const occupiedSlots: number[] = [];
    for (let i = 0; i < numSlots; i++) {
      const slotTime = new Date(fecha_hora);
      slotTime.setMinutes(slotTime.getMinutes() + i * 30);
      const slotDate = slotTime.toISOString().split('T')[0];
      const slotTimeStr = slotTime.toISOString().split('T')[1].split('.')[0];

      // Verificar horario disponible
      const horarioCheck = await pool.query(`
        SELECT h.* FROM horarios h
        WHERE h.barbero_id = $1 AND h.fecha = $2
        AND h.hora_inicio <= $3::time AND h.hora_fin > $3::time
        AND h.disponible = true
      `, [barbero_id, slotDate, slotTimeStr]);

      if (horarioCheck.rows.length === 0) {
        return res.status(409).json({ error: `Horario no disponible para el slot ${i + 1} del servicio` });
      }

      // Verificar que no hay reserva en este slot
      const reservaCheck = await pool.query(
        'SELECT * FROM reservas WHERE barbero_id = $1 AND fecha_hora = $2 AND estado != $3',
        [barbero_id, slotTime.toISOString(), 'cancelada']
      );

      if (reservaCheck.rows.length > 0) {
        return res.status(409).json({ error: `Ya existe una reserva en el slot ${i + 1} del servicio` });
      }

      occupiedSlots.push(horarioCheck.rows[0].id);
    }

    // Crear la reserva
    const result = await pool.query(
      'INSERT INTO reservas (usuario_id, barbero_id, servicio_id, fecha_hora) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, barbero_id, servicio_id, fecha_hora]
    );

    console.log(`Reserva creada: ID ${result.rows[0].id}, Usuario ${userId}, Barbero ${barbero_id}, Servicio ${servicio_id}, Fecha ${fecha_hora}`);

    // Marcar slots como no disponibles
    for (const slotId of occupiedSlots) {
      await pool.query('UPDATE horarios SET disponible = false WHERE id = $1', [slotId]);
    }

    // Obtener datos del usuario y servicio para el email
    const userData = await pool.query('SELECT email, nombre FROM usuarios WHERE id = $1', [userId]);
    const serviceData = await pool.query('SELECT nombre FROM servicios WHERE id = $1', [servicio_id]);
    const barberData = await pool.query(
      'SELECT u.nombre, u.apellido FROM barberos b JOIN usuarios u ON b.usuario_id = u.id WHERE b.id = $1',
      [barbero_id]
    );

    // Crear notificación web
    await pool.query(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)',
      [userId, 'confirmacion_reserva', 'Reserva Confirmada', 'Tu reserva ha sido confirmada exitosamente']
    );

    // Enviar email de confirmación (no bloqueante)
    try {
      const fechaFormateada = new Date(fecha_hora).toLocaleDateString('es-CO');
      const horaFormateada = new Date(fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      await enviarConfirmacionReserva(
        userData.rows[0].email,
        userData.rows[0].nombre,
        serviceData.rows[0].nombre,
        `${barberData.rows[0].nombre} ${barberData.rows[0].apellido}`,
        fechaFormateada,
        horaFormateada
      );
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
      // No fallar la reserva por error de email
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// PUT - Cancelar reserva (cliente, hasta 24h antes)
app.put('/api/reservas/:id/cancelar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verificar que la reserva pertenece al usuario
    const reservaResult = await pool.query('SELECT * FROM reservas WHERE id = $1 AND usuario_id = $2', [id, userId]);
    if (reservaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reserva = reservaResult.rows[0];

    // Verificar que faltan más de 24 horas
    const ahora = new Date();
    const fechaReserva = new Date(reserva.fecha_hora);
    const diffHoras = (fechaReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diffHoras < 24) {
      return res.status(400).json({ error: 'Solo puedes cancelar hasta 24 horas antes' });
    }

    // Obtener duración del servicio
    const serviceDurationData = await pool.query('SELECT duracion_min FROM servicios WHERE id = $1', [reserva.servicio_id]);
    const numSlots = Math.ceil(serviceDurationData.rows[0].duracion_min / 30.0);

    // Actualizar reserva
    await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelada', id]
    );

    // Liberar slots
    for (let i = 0; i < numSlots; i++) {
      const slotTime = new Date(reserva.fecha_hora);
      slotTime.setMinutes(slotTime.getMinutes() + i * 30);
      const slotDate = slotTime.toISOString().split('T')[0];
      const slotTimeStr = slotTime.toISOString().split('T')[1].split('.')[0];

      await pool.query(`
        UPDATE horarios SET disponible = true
        WHERE barbero_id = $1 AND fecha = $2
        AND hora_inicio <= $3::time AND hora_fin > $3::time
      `, [reserva.barbero_id, slotDate, slotTimeStr]);
    }

    // Obtener datos para el email
    const userData = await pool.query('SELECT email, nombre FROM usuarios WHERE id = $1', [userId]);
    const serviceData = await pool.query('SELECT nombre FROM servicios WHERE id = $1', [reserva.servicio_id]);

    // Crear notificación web
    await pool.query(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)',
      [userId, 'cancelacion', 'Reserva Cancelada', 'Tu reserva ha sido cancelada']
    );

    // Enviar email de cancelación (no bloqueante)
    try {
      const fechaFormateada = new Date(reserva.fecha_hora).toLocaleDateString('es-CO');

      await enviarCancelacionReserva(
        userData.rows[0].email,
        userData.rows[0].nombre,
        serviceData.rows[0].nombre,
        fechaFormateada
      );
    } catch (emailError) {
      console.error('Error enviando email de cancelación:', emailError);
      // No fallar la cancelación por error de email
    }

    res.json({ mensaje: 'Reserva cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

// PUT - Completar reserva (solo barbero)
app.put('/api/reservas/:id/completar', authenticateToken, requireRole(['barbero']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verificar que la reserva pertenece al barbero
    const reservaCheck = await pool.query(`
      SELECT r.* FROM reservas r
      JOIN barberos b ON r.barbero_id = b.id
      WHERE r.id = $1 AND b.usuario_id = $2
    `, [id, userId]);

    if (reservaCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permisos para completar esta reserva' });
    }

    // Actualizar estado
    const result = await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['completada', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al completar reserva:', error);
    res.status(500).json({ error: 'Error al completar reserva' });
  }
});

// PUT - Cancelar reserva por barbero (motivos de fuerza mayor)
app.put('/api/reservas/:id/cancelar_barbero', authenticateToken, requireRole(['barbero']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verificar que la reserva pertenece al barbero
    const reservaCheck = await pool.query(`
      SELECT r.* FROM reservas r
      JOIN barberos b ON r.barbero_id = b.id
      WHERE r.id = $1 AND b.usuario_id = $2
    `, [id, userId]);

    if (reservaCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permisos para cancelar esta reserva' });
    }

    const reserva = reservaCheck.rows[0];

    // Obtener duración del servicio
    const serviceDurationData = await pool.query('SELECT duracion_min FROM servicios WHERE id = $1', [reserva.servicio_id]);
    const numSlots = Math.ceil(serviceDurationData.rows[0].duracion_min / 30.0);

    // Actualizar reserva
    await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelada', id]
    );

    // Liberar slots
    for (let i = 0; i < numSlots; i++) {
      const slotTime = new Date(reserva.fecha_hora);
      slotTime.setMinutes(slotTime.getMinutes() + i * 30);
      const slotDate = slotTime.toISOString().split('T')[0];
      const slotTimeStr = slotTime.toISOString().split('T')[1].split('.')[0];

      await pool.query(`
        UPDATE horarios SET disponible = true
        WHERE barbero_id = $1 AND fecha = $2
        AND hora_inicio <= $3::time AND hora_fin > $3::time
      `, [reserva.barbero_id, slotDate, slotTimeStr]);
    }

    // Notificar al cliente (email y notificación web)
    const clienteData = await pool.query('SELECT email, nombre FROM usuarios WHERE id = $1', [reserva.usuario_id]);
    const serviceData = await pool.query('SELECT nombre FROM servicios WHERE id = $1', [reserva.servicio_id]);

    // Crear notificación web
    await pool.query(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)',
      [reserva.usuario_id, 'cancelacion', 'Reserva Cancelada por Barbero', 'Tu reserva ha sido cancelada por el barbero debido a imprevistos.']
    );

    // Enviar email (no bloqueante)
    try {
      const fechaFormateada = new Date(reserva.fecha_hora).toLocaleDateString('es-CO');
      await enviarCancelacionReserva(
        clienteData.rows[0].email,
        clienteData.rows[0].nombre,
        serviceData.rows[0].nombre,
        fechaFormateada
      );
    } catch (e) {
      console.error('Error enviando email:', e);
    }

    res.json({ mensaje: 'Reserva cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar reserva por barbero:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

// PUT - Cancelar reserva (Admin - Sin restricciones de tiempo)
app.put('/api/admin/reservas/:id/cancelar', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservaResult = await pool.query('SELECT * FROM reservas WHERE id = $1', [id]);
    if (reservaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const reserva = reservaResult.rows[0];

    // Obtener duración del servicio
    const serviceDurationData = await pool.query('SELECT duracion_min FROM servicios WHERE id = $1', [reserva.servicio_id]);
    const numSlots = Math.ceil(serviceDurationData.rows[0].duracion_min / 30.0);

    // Actualizar reserva
    await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelada', id]
    );

    // Liberar slots
    for (let i = 0; i < numSlots; i++) {
      const slotTime = new Date(reserva.fecha_hora);
      slotTime.setMinutes(slotTime.getMinutes() + i * 30);
      const slotDate = slotTime.toISOString().split('T')[0];
      const slotTimeStr = slotTime.toISOString().split('T')[1].split('.')[0];

      await pool.query(`
        UPDATE horarios SET disponible = true
        WHERE barbero_id = $1 AND fecha = $2
        AND hora_inicio <= $3::time AND hora_fin > $3::time
      `, [reserva.barbero_id, slotDate, slotTimeStr]);
    }

    res.json({ mensaje: 'Reserva cancelada por administrador' });
  } catch (error) {
    console.error('Error al cancelar reserva (admin):', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

// PUT - Reprogramar reserva
app.put('/api/reservas/:id/reprogramar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nueva_fecha_hora } = req.body;
    const userId = req.user!.id;

    if (!nueva_fecha_hora) {
      return res.status(400).json({ error: 'Nueva fecha y hora son obligatorias' });
    }

    // Verificar que la reserva pertenece al usuario
    const reservaResult = await pool.query('SELECT * FROM reservas WHERE id = $1 AND usuario_id = $2', [id, userId]);
    if (reservaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reserva = reservaResult.rows[0];

    // Obtener duración del servicio
    const serviceDurationData = await pool.query('SELECT duracion_min FROM servicios WHERE id = $1', [reserva.servicio_id]);
    const numSlots = Math.ceil(serviceDurationData.rows[0].duracion_min / 30.0);

    // Verificar que faltan más de 24 horas para la reprogramación
    const ahora = new Date();
    const fechaActual = new Date(reserva.fecha_hora);
    const diffHoras = (fechaActual.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diffHoras < 24) {
      return res.status(400).json({ error: 'Solo puedes reprogramar hasta 24 horas antes' });
    }

    // Verificar que todos los nuevos slots están disponibles
    const newOccupiedSlots: number[] = [];
    for (let i = 0; i < numSlots; i++) {
      const slotTime = new Date(nueva_fecha_hora);
      slotTime.setMinutes(slotTime.getMinutes() + i * 30);
      const slotDate = slotTime.toISOString().split('T')[0];
      const slotTimeStr = slotTime.toISOString().split('T')[1].split('.')[0];

      // Verificar horario disponible
      const horarioCheck = await pool.query(`
        SELECT h.* FROM horarios h
        WHERE h.barbero_id = $1 AND h.fecha = $2
        AND h.hora_inicio <= $3::time AND h.hora_fin > $3::time
        AND h.disponible = true
      `, [reserva.barbero_id, slotDate, slotTimeStr]);

      if (horarioCheck.rows.length === 0) {
        return res.status(409).json({ error: `El nuevo horario no está disponible para el slot ${i + 1}` });
      }

      // Verificar que no hay reserva en este slot
      const conflictoCheck = await pool.query(
        'SELECT * FROM reservas WHERE barbero_id = $1 AND fecha_hora = $2 AND estado != $3 AND id != $4',
        [reserva.barbero_id, slotTime.toISOString(), 'cancelada', id]
      );

      if (conflictoCheck.rows.length > 0) {
        return res.status(409).json({ error: `Ya existe una reserva en el nuevo slot ${i + 1}` });
      }

      newOccupiedSlots.push(horarioCheck.rows[0].id);
    }

    // Liberar los slots anteriores
    for (let i = 0; i < numSlots; i++) {
      const slotTime = new Date(reserva.fecha_hora);
      slotTime.setMinutes(slotTime.getMinutes() + i * 30);
      const slotDate = slotTime.toISOString().split('T')[0];
      const slotTimeStr = slotTime.toISOString().split('T')[1].split('.')[0];

      await pool.query(`
        UPDATE horarios SET disponible = true
        WHERE barbero_id = $1 AND fecha = $2
        AND hora_inicio <= $3::time AND hora_fin > $3::time
      `, [reserva.barbero_id, slotDate, slotTimeStr]);
    }

    // Actualizar la reserva
    const result = await pool.query(
      'UPDATE reservas SET fecha_hora = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [nueva_fecha_hora, id]
    );

    // Marcar los nuevos slots como no disponibles
    for (const slotId of newOccupiedSlots) {
      await pool.query('UPDATE horarios SET disponible = false WHERE id = $1', [slotId]);
    }

    // Crear notificación
    await pool.query(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)',
      [userId, 'reprogramacion', 'Reserva Reprogramada', 'Tu reserva ha sido reprogramada exitosamente']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al reprogramar reserva:', error);
    res.status(500).json({ error: 'Error al reprogramar reserva' });
  }
});

// ===== ENDPOINTS DE ESTADÍSTICAS =====

// GET - Estadísticas generales (super_admin)
app.get('/api/estadisticas', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    // Total de reservas
    const totalReservas = await pool.query('SELECT COUNT(*) as total FROM reservas');

    // Reservas por mes (últimos 6 meses)
    const reservasPorMes = await pool.query(`
      SELECT
        TO_CHAR(fecha_hora, 'YYYY-MM') as mes,
        COUNT(*) as cantidad
      FROM reservas
      WHERE fecha_hora >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(fecha_hora, 'YYYY-MM')
      ORDER BY mes
    `);

    // Ingresos totales
    const ingresosTotales = await pool.query(`
      SELECT COALESCE(SUM(s.precio), 0) as total
      FROM reservas r
      JOIN servicios s ON r.servicio_id = s.id
      WHERE r.estado = 'confirmada'
    `);

    // Servicios más populares
    const serviciosPopulares = await pool.query(`
      SELECT s.nombre, COUNT(r.id) as reservas
      FROM servicios s
      LEFT JOIN reservas r ON s.id = r.servicio_id AND r.estado = 'confirmada'
      GROUP BY s.id, s.nombre
      ORDER BY reservas DESC
      LIMIT 5
    `);

    // Barberos más activos
    const barberosActivos = await pool.query(`
      SELECT u.nombre, u.apellido, COUNT(r.id) as reservas
      FROM usuarios u
      JOIN barberos b ON u.id = b.usuario_id
      LEFT JOIN reservas r ON b.id = r.barbero_id AND r.estado = 'confirmada'
      GROUP BY u.id, u.nombre, u.apellido
      ORDER BY reservas DESC
      LIMIT 5
    `);

    res.json({
      totalReservas: parseInt(totalReservas.rows[0].total),
      reservasPorMes: reservasPorMes.rows,
      ingresosTotales: parseFloat(ingresosTotales.rows[0].total),
      serviciosPopulares: serviciosPopulares.rows,
      barberosActivos: barberosActivos.rows
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ===== ENDPOINTS DE PAGOS =====

// POST - Procesar pago simulado
app.post('/api/pagos', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reserva_id, metodo } = req.body;
    const userId = req.user!.id;

    if (!reserva_id || !metodo) {
      return res.status(400).json({ error: 'Reserva y método de pago son obligatorios' });
    }

    if (!['efectivo', 'tarjeta'].includes(metodo)) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }

    // Verificar que la reserva pertenece al usuario y está confirmada
    const reservaResult = await pool.query(
      'SELECT r.*, s.precio FROM reservas r JOIN servicios s ON r.servicio_id = s.id WHERE r.id = $1 AND r.usuario_id = $2 AND r.estado = $3',
      [reserva_id, userId, 'confirmada']
    );

    if (reservaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no válida para pago' });
    }

    const reserva = reservaResult.rows[0];

    // Verificar que no hay pago previo
    const pagoCheck = await pool.query('SELECT * FROM pagos WHERE reserva_id = $1', [reserva_id]);
    if (pagoCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un pago para esta reserva' });
    }

    // Crear pago simulado
    const result = await pool.query(
      'INSERT INTO pagos (reserva_id, metodo, monto) VALUES ($1, $2, $3) RETURNING *',
      [reserva_id, metodo, reserva.precio]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

// ===== ENDPOINTS DE NOTIFICACIONES =====

// GET - Mis notificaciones
app.get('/api/notificaciones', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      'SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY fecha_creacion DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// PUT - Marcar notificación como leída
app.put('/api/notificaciones/:id/leida', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

// Iniciar sistema de recordatorios
iniciarRecordatorios();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});