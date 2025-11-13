-- Script para crear la tabla de usuarios


CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(7) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contraseña VARCHAR(100) NOT NULL,
    acepta_terminos BOOLEAN NOT NULL DEFAULT false,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO usuarios (id, nombre, apellido, telefono, correo, contraseña, acepta_terminos)
VALUES
    ('0001', 'Briann', 'Romero', '3134750712', 'bromero12@example.com', '12345678', true),
    ('0002', 'Nicolas', 'Moreno', '3001234567', 'nicolas@example.com', '12345678', true),
    ('0003', 'Johan', 'Forero', '3211234567', 'johan@example.com', '12345678', true)
    
ON CONFLICT (correo) DO NOTHING;