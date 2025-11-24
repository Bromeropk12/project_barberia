import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../auth';
import { pool } from '../database';
import { enviarConfirmacionReserva, enviarCancelacionReserva } from '../emailService';

const router = Router();

// GET - Mis reservas (cliente)
router.get('/mis', authenticateToken, async (req: Request, res: Response) => {
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
router.get('/barberia', authenticateToken, requireRole(['barbero']), async (req: Request, res: Response) => {
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
router.get('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.post('/', authenticateToken, async (req: Request, res: Response) => {
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
      const slotTimeStr = slotTime.toTimeString().substring(0, 8);

      console.log(`Checking slot ${i + 1}: barbero_id=${barbero_id}, slotDate=${slotDate}, slotTimeStr=${slotTimeStr}`);

      // Verificar que el horario existe en la tabla
      const horarioCheck = await pool.query(`
        SELECT h.* FROM horarios h
        WHERE h.barbero_id = $1 AND h.fecha = $2
        AND h.hora_inicio <= $3::time AND h.hora_fin > $3::time
      `, [barbero_id, slotDate, slotTimeStr]);

      console.log(`horarioCheck rows: ${horarioCheck.rows.length}`);

      if (horarioCheck.rows.length === 0) {
        console.log('No horario found for slot', i + 1);
        return res.status(409).json({ error: `Horario no existe para el slot ${i + 1} del servicio` });
      }

      // Verificar que no hay reserva activa en este slot
      const reservaCheck = await pool.query(
        'SELECT * FROM reservas WHERE barbero_id = $1 AND fecha_hora = $2 AND estado IN ($3, $4)',
        [barbero_id, slotTime.toISOString(), 'pendiente', 'confirmada']
      );

      console.log(`reservaCheck rows: ${reservaCheck.rows.length}`);

      if (reservaCheck.rows.length > 0) {
        console.log('Conflicting reservation found for slot', i + 1);
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
router.put('/:id/cancelar', authenticateToken, async (req: Request, res: Response) => {
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
router.put('/:id/completar', authenticateToken, requireRole(['barbero']), async (req: Request, res: Response) => {
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
router.put('/:id/cancelar_barbero', authenticateToken, requireRole(['barbero']), async (req: Request, res: Response) => {
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
router.put('/:id/cancelar', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.put('/:id/reprogramar', authenticateToken, async (req: Request, res: Response) => {
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

export default router;