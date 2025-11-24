import nodemailer from 'nodemailer';

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Función para enviar email de confirmación de reserva
export const enviarConfirmacionReserva = async (
  email: string,
  nombre: string,
  servicio: string,
  barbero: string,
  fecha: string,
  hora: string
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Confirmación de Reserva - UAN Barber',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Confirmación de Reserva</h2>
          <p>Hola ${nombre},</p>
          <p>Tu reserva ha sido confirmada exitosamente:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Barbero:</strong> ${barbero}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${hora}</p>
          </div>
          <p>Te esperamos en UAN Barber.</p>
          <p>Si necesitas cancelar o reprogramar, puedes hacerlo hasta 24 horas antes.</p>
          <br>
          <p>Saludos,<br>Equipo UAN Barber</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email de confirmación enviado a:', email);
  } catch (error) {
    console.error('Error enviando email de confirmación:', error);
    throw error;
  }
};

// Función para enviar email de cancelación
export const enviarCancelacionReserva = async (
  email: string,
  nombre: string,
  servicio: string,
  fecha: string
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Cancelación de Reserva - UAN Barber',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Cancelación de Reserva</h2>
          <p>Hola ${nombre},</p>
          <p>Tu reserva ha sido cancelada:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
          </div>
          <p>Puedes hacer una nueva reserva cuando desees.</p>
          <br>
          <p>Saludos,<br>Equipo UAN Barber</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email de cancelación enviado a:', email);
  } catch (error) {
    console.error('Error enviando email de cancelación:', error);
    throw error;
  }
};

// Función para enviar recordatorio
export const enviarRecordatorio = async (
  email: string,
  nombre: string,
  servicio: string,
  barbero: string,
  fecha: string,
  hora: string
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Recordatorio de Reserva - UAN Barber',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Recordatorio de Reserva</h2>
          <p>Hola ${nombre},</p>
          <p>Te recordamos tu reserva para mañana:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Barbero:</strong> ${barbero}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${hora}</p>
          </div>
          <p>¡Te esperamos!</p>
          <br>
          <p>Saludos,<br>Equipo UAN Barber</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email de recordatorio enviado a:', email);
  } catch (error) {
    console.error('Error enviando email de recordatorio:', error);
    throw error;
  }
};