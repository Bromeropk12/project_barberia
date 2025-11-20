import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './database';
import { authenticateToken, requireRole } from './auth';

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON en el body

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ mensaje: 'API de Brookings Barber funcionando correctamente' });
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
      SELECT b.*, u.nombre, u.apellido, u.email
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

// POST - Crear barbero (solo super_admin)
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

    // Verificar que el horario está disponible
    const horarioCheck = await pool.query(`
      SELECT h.* FROM horarios h
      WHERE h.barbero_id = $1 AND h.fecha = $2::date
      AND h.hora_inicio <= $2::time AND h.hora_fin > $2::time
      AND h.disponible = true
    `, [barbero_id, fecha_hora]);

    if (horarioCheck.rows.length === 0) {
      return res.status(409).json({ error: 'Horario no disponible' });
    }

    // Verificar que no hay otra reserva en el mismo horario
    const reservaCheck = await pool.query(
      'SELECT * FROM reservas WHERE barbero_id = $1 AND fecha_hora = $2 AND estado != $3',
      [barbero_id, fecha_hora, 'cancelada']
    );

    if (reservaCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe una reserva en este horario' });
    }

    const result = await pool.query(
      'INSERT INTO reservas (usuario_id, barbero_id, servicio_id, fecha_hora) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, barbero_id, servicio_id, fecha_hora]
    );

    // Marcar horario como no disponible
    await pool.query(
      'UPDATE horarios SET disponible = false WHERE id = $1',
      [horarioCheck.rows[0].id]
    );

    // Crear notificación
    await pool.query(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)',
      [userId, 'confirmacion_reserva', 'Reserva Confirmada', 'Tu reserva ha sido confirmada exitosamente']
    );

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

    // Actualizar reserva
    await pool.query(
      'UPDATE reservas SET estado = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelada', id]
    );

    // Liberar horario
    await pool.query(`
      UPDATE horarios SET disponible = true
      WHERE barbero_id = $1 AND fecha = $2::date
      AND hora_inicio <= $2::time AND hora_fin > $2::time
    `, [reserva.barbero_id, reserva.fecha_hora]);

    // Crear notificación
    await pool.query(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)',
      [userId, 'cancelacion', 'Reserva Cancelada', 'Tu reserva ha sido cancelada']
    );

    res.json({ mensaje: 'Reserva cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});