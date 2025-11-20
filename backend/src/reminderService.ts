import cron from 'node-cron';
import { pool } from './database';
import { enviarRecordatorio } from './emailService';

// Función para enviar recordatorios de reservas del día siguiente
export const enviarRecordatoriosDiarios = async () => {
  try {
    console.log('Ejecutando envío de recordatorios diarios...');

    // Obtener reservas para mañana que estén confirmadas
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];

    const reservasResult = await pool.query(`
      SELECT r.*, u.email, u.nombre,
             s.nombre as servicio_nombre,
             b.id as barbero_id,
             ub.nombre as barbero_nombre, ub.apellido as barbero_apellido
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN servicios s ON r.servicio_id = s.id
      JOIN barberos b ON r.barbero_id = b.id
      JOIN usuarios ub ON b.usuario_id = ub.id
      WHERE DATE(r.fecha_hora) = $1
      AND r.estado = 'confirmada'
    `, [fechaManana]);

    console.log(`Encontradas ${reservasResult.rows.length} reservas para mañana`);

    // Enviar recordatorio para cada reserva
    for (const reserva of reservasResult.rows) {
      try {
        const fechaFormateada = new Date(reserva.fecha_hora).toLocaleDateString('es-CO');
        const horaFormateada = new Date(reserva.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        await enviarRecordatorio(
          reserva.email,
          reserva.nombre,
          reserva.servicio_nombre,
          `${reserva.barbero_nombre} ${reserva.barbero_apellido}`,
          fechaFormateada,
          horaFormateada
        );

        console.log(`Recordatorio enviado a ${reserva.email}`);
      } catch (emailError) {
        console.error(`Error enviando recordatorio a ${reserva.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error en envío de recordatorios diarios:', error);
  }
};

// Función para iniciar el programador de recordatorios
export const iniciarRecordatorios = () => {
  // Ejecutar todos los días a las 9:00 AM
  cron.schedule('0 9 * * *', () => {
    enviarRecordatoriosDiarios();
  }, {
    timezone: 'America/New_York'
  });

  console.log('Sistema de recordatorios iniciado - se ejecutará diariamente a las 9:00 AM EST');
};

// Función manual para probar recordatorios (opcional)
export const probarRecordatorios = async () => {
  await enviarRecordatoriosDiarios();
};