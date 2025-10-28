const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '.env') });
if (dotenvResult.error) {
  console.warn('⚠️  dotenv failed to load .env:', dotenvResult.error.message);
} else if (dotenvResult.parsed) {
  const loadedKeys = Object.keys(dotenvResult.parsed).filter(k => k !== 'JWT_SECRET');
  console.log('✅ Loaded .env keys:', loadedKeys);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const uploadRoutes = require('./routes/upload');
const paymentRoutes = require('./routes/payments');
const productRoutes = require('./routes/bazaar/products');
const orderRoutes = require('./routes/bazaar/orders');
const sellerRoutes = require('./routes/bazaar/sellers');
const deliveryRoutes = require('./routes/deliveries');
const vverseRoutes = require('./routes/vverse');
const blockchainRoutes = require('./routes/blockchain');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Security middleware (allow cross-origin images for frontend to load /uploads)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files with CORP header to allow cross-origin fetching from frontend
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  next();
}, express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VeridaX API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

// Bazaar API routes
app.use('/api/bazaar/products', productRoutes);
app.use('/api/bazaar/orders', orderRoutes);
app.use('/api/bazaar/sellers', sellerRoutes);
app.use('/api/deliveries', deliveryRoutes);

// VVerse API routes
app.use('/api/vverse', vverseRoutes);

// Blockchain API routes
app.use('/api/blockchain', blockchainRoutes);

// Socket.IO middleware
io.use((socket, next) => {
  // Authentication middleware for socket connections
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected to VVerse`);

  // Join room for user-specific notifications
  socket.join(`user_${socket.userId}`);

  // Join project rooms
  socket.on('join_room', (roomId) => {
    socket.join(`room_${roomId}`);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });

  // Leave project rooms
  socket.on('leave_room', (roomId) => {
    socket.leave(`room_${roomId}`);
    console.log(`User ${socket.userId} left room ${roomId}`);
  });

  // Handle new messages
  socket.on('new_message', (data) => {
    // Broadcast message to room members
    socket.to(`room_${data.roomId}`).emit('message_received', data);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`room_${data.roomId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`room_${data.roomId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected from VVerse`);
  });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 VeridaX Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.IO server ready for VVerse connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
