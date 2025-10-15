require('dotenv').config();
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY);
console.log('TEST_VAR:', process.env.TEST_VAR);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const volunteerOpportunityRoutes = require('./routes/volunteerOpportunityRoutes');
const projectRoutes = require('./routes/projectRoutes');
const crowdfundingRoutes = require('./routes/crowdfunding');
const vverseRoutes = require('./routes/vverseRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const { uploadDir } = require('./middleware/upload');
const { authenticateToken } = require('./middleware/auth');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:8080"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["my-custom-header"],
        transports: ['polling', 'websocket']
    }
});

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:8080"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files - make sure this line exists and is before your routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    if (req.file) {
        console.log('Uploaded file:', req.file);
    }
    next();
});

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/volunteer-opportunities', volunteerOpportunityRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/crowdfunding', crowdfundingRoutes);
app.use('/api/vverse', vverseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Join chat room
    socket.on('join-chat', (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave-chat', (chatId) => {
        socket.leave(chatId);
        console.log(`User left chat: ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible to routes
app.set('io', io);

// Database connection
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Remove the app.listen() call from here
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Keep only this server.listen() at the bottom
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});