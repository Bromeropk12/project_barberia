import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../auth';
import { pool } from '../database';

const router = Router();

// GET - Obtener perfil del usuario autenticado
router.get('/perfil', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT - Actualizar perfil del usuario
router.put('/perfil', authenticateToken, async (req: Request, res: Response) => {
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
router.get('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, email, nombre, apellido, telefono, rol, fecha_registro FROM usuarios ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PUT - Cambiar rol de usuario (solo super_admin)
router.put('/:id/rol', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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

export default router;