require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const { errorHandler } = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');
const carRoutes = require('./src/routes/carRoutes');
const reservationRoutes = require('./src/routes/reservationRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const complaintRoutes = require('./src/routes/complaintRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const handoverRoutes = require('./src/routes/handoverRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const employeeSelfRoutes = require('./src/routes/employeeSelfRoutes');
const { initCronJobs } = require('./src/utils/cronJobs');
const advertisementRoutes = require('./src/routes/advertisementRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const financeRoutes = require('./src/routes/financeRoutes');
// const employeeRoutes = require('./routes/employees');
const path = require("path");
// const express = require("express");
const app = express();
// Railway يعمل خلف reverse proxy ويضيف X-Forwarded-For.
// تفعيل الثقة في أول proxy يسمح لـ express-rate-limit بحساب عنوان العميل بشكل صحيح.
app.set('trust proxy', 1);
const server = http.createServer(app);
//تحقق من الايميل
const testEmailRoutes = require('./src/routes/testEmailRoutes');
// ========================
// Socket.io Setup
// ========================
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3000', 'http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on('join_complaint_room', (complaintId) => {
    socket.join(`complaint_${complaintId}`);
    console.log(`💬 User ${socket.id} joined complaint room ${complaintId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ========================
// Security Middleware
// ========================
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3000', 'http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // زيادة الحد في بيئة التطوير
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ========================
// Body Parsing
// ========================
// Stripe and WhatsApp webhooks need their raw request body for signature verification.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/whatsapp/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================
// Logging
// ========================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// ========================
// تحقق من الايميل
// ========================
app.use("/api/auth", testEmailRoutes);
// ========================
// Static Files
// ========================
app.use('/uploads', express.static('uploads'));

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/employee-self', employeeSelfRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use("/uploads",  express.static(path.join(__dirname, "uploads")));
app.use( '/api/advertisementController', advertisementRoutes);
// ========================
// Health Check
// ========================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚗 Car Rental API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ========================
// 404 Handler
// ========================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ========================
// Global Error Handler
// ========================
app.use(errorHandler);

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🚗 Car Rental API Server           ║
  ║   Port: ${PORT}                          ║
  ║   Mode: ${process.env.NODE_ENV || 'development'}               ║
  ║   URL: http://localhost:${PORT}/api    ║
  ╚══════════════════════════════════════╝
  `);

  // Initialize Cron Jobs
  initCronJobs(io);
});

module.exports = { app, server };
