import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { pool } from '../database';

const router = Router();

// POST - Procesar pago simulado
router.post('/', authenticateToken, async (req: Request, res: Response) => {
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

export default router;