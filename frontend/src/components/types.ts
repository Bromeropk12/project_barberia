// components/types.ts - Interfaces compartidas
export interface User {
    id: number;
    stack_auth_id: string;
    email: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    rol: 'cliente' | 'barbero' | 'super_admin';
}

export interface Servicio {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    duracion_min: number;
    activo?: boolean;
}

export interface Barbero {
    id: number;
    usuario_id: number;
    turno_trabajo?: string;
    estado: string;
    experiencia_anios?: number;
    especialidades?: string;
    nombre: string;
    apellido: string;
    email: string;
}

export interface Reserva {
    id: number;
    fecha_hora: string;
    estado: string;
    servicio_nombre: string;
    precio: number;
    duracion_min?: number;
    barbero_nombre: string;
    barbero_apellido: string;
    cliente_nombre?: string;
    cliente_apellido?: string;
    telefono?: string;
}

export interface Horario {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    disponible: boolean;
}

export interface RegisterData {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirmPassword: string;
    telefono?: string;
}

export type AdminSubView = 'reservas' | 'barberos' | 'servicios' | 'estadisticas';

// Función helper para formatear fechas
export const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/New_York',
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(dateString));
};
