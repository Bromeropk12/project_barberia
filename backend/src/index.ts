import express, { Request, Response } from 'express';
import cors from 'cors';
import { iniciarRecordatorios } from './reminderService';

// Importar routers modularizados
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import serviceRoutes from './routes/services';
import barberRoutes from './routes/barbers';
import scheduleRoutes from './routes/schedules';
import reservationRoutes from './routes/reservations';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import statsRoutes from './routes/stats';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON en el body

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ mensaje: 'API de UAN Barber funcionando correctamente' });
});

// Usar routers modularizados
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/servicios', serviceRoutes);
app.use('/api/barberos', barberRoutes);
app.use('/api/horarios', scheduleRoutes);
app.use('/api/reservas', reservationRoutes);
app.use('/api/pagos', paymentRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/estadisticas', statsRoutes);

// Iniciar sistema de recordatorios
iniciarRecordatorios();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});