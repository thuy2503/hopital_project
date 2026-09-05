import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { initScheduler } from './services/scheduler.js';
import { initSocket } from './socket.js';
import { createServer } from 'http';

dotenv.config();

const app = express();
const httpServer = createServer(app);
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: "Bạn đã thao tác quá nhanh. Vui lòng thử lại sau 15 phút." }
});
app.use('/api/', limiter);

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import recordRoutes from './routes/records.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import dashboardRoutes from './routes/dashboard.js';
import drugRoutes from './routes/drugs.js';
import invoiceRoutes from './routes/invoices.js';
import searchRoutes from './routes/search.js';
import reportRoutes from './routes/reports.js';
import serviceRoutes from './routes/services.js';
import postRoutes from './routes/posts.js';
import reviewRoutes from './routes/reviews.js';
import subscriptionRoutes from './routes/subscriptions.js';
import chatRoutes from './routes/chat.js';
import labTestRoutes from './routes/labtests.js';

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/labtests', labTestRoutes);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EMR API is running' });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initScheduler(); // Khởi tạo bộ lập lịch nhắc hẹn
  initSocket(httpServer); // Khởi tạo Socket.io
});
