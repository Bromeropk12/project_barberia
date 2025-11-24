-- Esquema de Base de Datos Completo - PostgreSQL para UAN Barber
-- Tabla de usuarios (perfiles adicionales, Stack Auth maneja auth)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    stack_auth_id VARCHAR(255) UNIQUE, -- ID de Stack Auth (opcional para compatibilidad)
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Hash de contraseña para autenticación local
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('cliente', 'barbero', 'super_admin')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    duracion_min INTEGER NOT NULL, -- duración en minutos
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de barberos (perfiles específicos)
CREATE TABLE IF NOT EXISTS barberos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    turno_trabajo VARCHAR(20) CHECK (turno_trabajo IN ('manana', 'tarde', 'completo')),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_descanso', 'de_vacaciones', 'inactivo')),
    experiencia_anios INTEGER DEFAULT 0,
    especialidades TEXT, -- JSON o texto con especialidades
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de horarios disponibles (slots de 30 min)
CREATE TABLE IF NOT EXISTS horarios (
    id SERIAL PRIMARY KEY,
    barbero_id INTEGER REFERENCES barberos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL, -- ej: '09:00'
    hora_fin TIME NOT NULL, -- ej: '09:30'
    disponible BOOLEAN DEFAULT true,
    UNIQUE(barbero_id, fecha, hora_inicio) -- un slot único por barbero
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    barbero_id INTEGER REFERENCES barberos(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP NOT NULL, -- fecha y hora de la reserva
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada', 'completada')),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos simulados
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
    metodo VARCHAR(20) CHECK (metodo IN ('efectivo', 'tarjeta')),
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    simulado BOOLEAN DEFAULT true -- siempre true para simulación
);

-- Tabla de notificaciones web
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'confirmacion_reserva', 'recordatorio', 'cancelacion'
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_stack_auth_id ON usuarios(stack_auth_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_barberos_usuario_id ON barberos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_barberos_estado ON barberos(estado);
CREATE INDEX IF NOT EXISTS idx_horarios_barbero_fecha ON horarios(barbero_id, fecha);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha_disponible ON horarios(fecha, disponible);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_barbero_fecha ON reservas(barbero_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_hora ON reservas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);

-- Datos iniciales

-- Usuario Super Admin (crear manualmente o vía Stack Auth)
-- NOTA: El stack_auth_id debe obtenerse de Stack Auth después del registro
INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono, rol) VALUES
('admin@barberia.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', '3000000000', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Servicios básicos
INSERT INTO servicios (nombre, descripcion, precio, duracion_min) VALUES
('Corte de Cabello', 'Corte moderno con tijeras y máquina', 25000.00, 30),
('Afeitado Clásico', 'Afeitado tradicional con navaja', 15000.00, 20),
('Corte + Barba', 'Corte de cabello y arreglo de barba', 35000.00, 45),
('Solo Barba', 'Recorte y arreglo de barba', 18000.00, 15)
ON CONFLICT DO NOTHING;

-- Función para generar slots de horario (opcional, para inicializar)
-- Esta función puede ejecutarse para poblar horarios automáticamente
CREATE OR REPLACE FUNCTION generar_horarios_barbero(
    p_barbero_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
) RETURNS VOID AS $$
DECLARE
    fecha_actual DATE := p_fecha_inicio;
    hora_actual TIME := '09:00';
    disponible BOOLEAN := true;
BEGIN
    WHILE fecha_actual <= p_fecha_fin LOOP
        hora_actual := '09:00';
        WHILE hora_actual < '18:00' LOOP
            -- Marcar almuerzo (12:00 - 13:00) como no disponible
            disponible := NOT (hora_actual >= '12:00' AND hora_actual < '13:00');

            INSERT INTO horarios (barbero_id, fecha, hora_inicio, hora_fin, disponible)
            VALUES (p_barbero_id, fecha_actual, hora_actual, hora_actual + INTERVAL '30 minutes', disponible)
            ON CONFLICT (barbero_id, fecha, hora_inicio) DO NOTHING;

            hora_actual := hora_actual + INTERVAL '30 minutes';
        END LOOP;
        fecha_actual := fecha_actual + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentarios finales
-- 1. Ejecutar este script en una BD vacía
-- 2. Después de crear usuario super_admin en Stack Auth, actualizar stack_auth_id
-- 3. Crear barberos vía Super Admin después de setup
-- 4. Usar generar_horarios_barbero() para inicializar disponibilidad