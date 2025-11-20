import axios from 'axios';
import { User, Barbero, Servicio, Reserva, Horario } from './components/types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const auth = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (data: any) =>
        api.post('/auth/register', data),
    getProfile: () =>
        api.get<User>('/usuarios/perfil'),
};

export const admin = {
    getStats: () =>
        api.get('/estadisticas'),
    registerBarber: (data: any) =>
        api.post('/admin/barberos/register', data),
    cancelReservation: (id: number) =>
        api.put(`/admin/reservas/${id}/cancelar`),
};

export const barberos = {
    getAll: () =>
        api.get<Barbero[]>('/barberos'),
    create: (data: any) =>
        api.post('/barberos', data), // Legacy/Simple create
    update: (id: number, data: any) =>
        api.put(`/barberos/${id}`, data),
    delete: (id: number) =>
        api.delete(`/barberos/${id}`),
    getHorarios: (barberoId: number, fecha: string) =>
        api.get<Horario[]>(`/horarios/${barberoId}/${fecha}`),
};

export const servicios = {
    getAll: () =>
        api.get<Servicio[]>('/servicios'),
    create: (data: any) =>
        api.post('/servicios', data),
    update: (id: number, data: any) =>
        api.put(`/servicios/${id}`, data),
    delete: (id: number) =>
        api.delete(`/servicios/${id}`),
};

export const reservas = {
    getAll: () =>
        api.get<Reserva[]>('/reservas'), // Admin
    getMyReservas: () =>
        api.get<Reserva[]>('/reservas/mis'), // Client
    getBarberReservas: () =>
        api.get<Reserva[]>('/reservas/barberia'), // Barber
    create: (data: any) =>
        api.post('/reservas', data),
    cancel: (id: number) =>
        api.put(`/reservas/${id}/cancelar`), // Client
    reprogram: (id: number, fechaHora: string) =>
        api.put(`/reservas/${id}/reprogramar`, { nueva_fecha_hora: fechaHora }),
    complete: (id: number) =>
        api.put(`/reservas/${id}/completar`),
    cancelByBarber: (id: number) =>
        api.put(`/reservas/${id}/cancelar_barbero`),
};

export const horarios = {
    toggleAvailability: (id: number, disponible: boolean) =>
        api.put(`/horarios/${id}/disponibilidad`, { disponible }),
    generate: (data: { barbero_id: number, fecha_inicio: string, fecha_fin: string }) =>
        api.post('/horarios/generar', data),
};

export default api;
