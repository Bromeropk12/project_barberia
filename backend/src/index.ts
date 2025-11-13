import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './database';

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON en el body

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ mensaje: 'API de Usuarios funcionando correctamente' });
});

// GET - Obtener todos los usuarios
app.get('/api/usuarios', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios ORDER BY CAST(id AS INTEGER) DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST - Crear un nuevo usuario
app.post('/api/usuarios', async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, telefono, correo, contraseña, acepta_terminos } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !telefono || !correo || !contraseña) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (!acepta_terminos) {
      return res.status(400).json({ error: 'Debe aceptar los términos y condiciones' });
    }

    // Calcular próximo ID consecutivo sin huecos
    const idsResult = await pool.query('SELECT id FROM usuarios ORDER BY id');
    const ids = idsResult.rows.map(r => parseInt(r.id));
    let nextNum = 1;
    while (ids.includes(nextNum)) nextNum++;
    const nextId = nextNum.toString().padStart(4, '0');

    const result = await pool.query(
      'INSERT INTO usuarios (id, nombre, apellido, telefono, correo, contraseña, acepta_terminos) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nextId, nombre, apellido, telefono, correo, contraseña, acepta_terminos]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al crear usuario:', error);

    // Manejar error de correo duplicado
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// DELETE - Eliminar un usuario
app.delete('/api/usuarios/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado correctamente', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});