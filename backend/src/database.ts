import { Pool } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '../.env.local' });

// Crear pool de conexiones a PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar conexión
pool.on('connect', () => {
  console.log('Conectado a la base de datos Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
});