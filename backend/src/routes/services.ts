import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../auth';
import { pool } from '../database';

const router = Router();

// GET - Listar servicios activos
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM servicios WHERE activo = true ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// POST - Crear servicio (solo super_admin)
router.post('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.put('/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.delete('/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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

export default router;