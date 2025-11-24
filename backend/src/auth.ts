import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { pool } from './database';

// JWKS cliente para Stack Auth
const client = jwksClient({
  jwksUri: 'https://api.stack-auth.com/api/v1/projects/df63ef4e-80a2-4662-8895-351337c7e39f/.well-known/jwks.json'
});

// Función para obtener la clave pública
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else if (key) {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    } else {
      callback(new Error('Clave no encontrada'));
    }
  });
}

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware de autenticación
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    // Verificar token JWT estándar
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');

    // Buscar usuario en BD
    const userResult = await pool.query(
      'SELECT id, email, nombre, apellido, telefono, rol FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar rol
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
};