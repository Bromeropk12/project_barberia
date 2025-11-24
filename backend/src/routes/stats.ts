import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../auth';
import { pool } from '../database';

const router = Router();

// GET - Estadísticas generales (super_admin)
router.get('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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

export default router;