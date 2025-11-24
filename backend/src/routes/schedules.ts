import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { pool } from '../database';

const router = Router();

// GET - Obtener horarios de un barbero en una fecha (con disponibilidad en tiempo real)
router.get('/:barberoId/:fecha', async (req: Request, res: Response) => {
  try {
    const { barberoId, fecha } = req.params;

    // Obtener TODOS los horarios del barbero para esa fecha
    const horariosResult = await pool.query(
      'SELECT * FROM horarios WHERE barbero_id = $1 AND fecha = $2 ORDER BY hora_inicio',
      [barberoId, fecha]
    );

    // Obtener todas las reservas activas del barbero para esa fecha
    const reservasResult = await pool.query(`
      SELECT fecha_hora, duracion_min
      FROM reservas r
      JOIN servicios s ON r.servicio_id = s.id
      WHERE r.barbero_id = $1
        AND DATE(r.fecha_hora AT TIME ZONE 'America/Bogota')::text = $2
        AND r.estado IN ('pendiente', 'confirmada')
    `, [barberoId, fecha]);

    const ahora = new Date();

    // Marcar disponibilidad para cada horario
    const horariosConDisponibilidad = horariosResult.rows.map(horario => {
      const fechaHoraSlot = new Date(`${fecha}T${horario.hora_inicio}`);

      // 1. Verificar si ya pasó la hora
      const yaPaso = fechaHoraSlot <= ahora;

      // 2. Verificar si hay una reserva activa en este slot
      const tieneReserva = reservasResult.rows.some(reserva => {
        const fechaHoraReserva = new Date(reserva.fecha_hora);
        const duracionMinutos = reserva.duracion_min || 30;
        const numSlots = Math.ceil(duracionMinutos / 30);

        // Verificar si este slot está dentro del rango de la reserva
        for (let i = 0; i < numSlots; i++) {
          const slotReserva = new Date(fechaHoraReserva);
          slotReserva.setMinutes(slotReserva.getMinutes() + i * 30);

          const horaSlotReserva = slotReserva.toTimeString().substring(0, 5);
          const horaSlotActual = horario.hora_inicio.substring(0, 5);

          if (horaSlotReserva === horaSlotActual) {
            return true;
          }
        }
        return false;
      });

      // El horario está disponible solo si NO ha pasado Y NO tiene reserva Y está marcado como disponible en BD
      const disponible = !yaPaso && !tieneReserva && horario.disponible;

      return {
        ...horario,
        disponible
      };
    });

    res.json(horariosConDisponibilidad);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

// POST - Generar horarios para un barbero (super_admin o barbero)
router.post('/generar', authenticateToken, async (req: Request, res: Response) => {
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
router.put('/:id/disponibilidad', authenticateToken, async (req: Request, res: Response) => {
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

export default router;