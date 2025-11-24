import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { authenticateToken, requireRole } from '../auth';
import { pool } from '../database';

const router = Router();

// GET - Listar barberos activos
router.get('/', async (req: Request, res: Response) => {
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
router.post('/register', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.post('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.delete('/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
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
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
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

export default router;