// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { PORT, API_BASE_URL } from './utils/config';
import logger from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';

// Import routes (Custom Aggregation Logic)
import dashboardRoutes from './routes/dashboard';
import familyRoutes from './routes/family';
import membersRoutes from './routes/members';
// Note: tasks, quests, store, meals, auth are now handled by proxy middleware

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for mobile development
    credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'momentum-mobile-bff' });
});

// Root route for Render health checks
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'momentum-mobile-bff', version: '1.0.0' });
});

// Routes
// Custom Routes (Aggregation/Transformation)
app.use('/mobile-bff/dashboard', dashboardRoutes);
app.use('/mobile-bff/family', familyRoutes);
app.use('/mobile-bff/members', membersRoutes);

// Proxy Routes (Direct API Mapping)
// 1. Store (Special mapping: /store -> /store-items)
app.use('/mobile-bff/store', createProxyMiddleware({
    target: API_BASE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/mobile-bff/store': '/store-items' // Maps /mobile-bff/store/x -> /api/v1/store-items/x
    }
}));

// 2. Standard Routes (Direct mapping)
// Matches: /mobile-bff/auth, /mobile-bff/tasks, /mobile-bff/quests, /mobile-bff/meals
const standardProxy = createProxyMiddleware({
    target: API_BASE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/mobile-bff': '' // Maps /mobile-bff/tasks -> /api/v1/tasks (assuming API_BASE_URL includes /api/v1)
    }
});

app.use('/mobile-bff/auth', standardProxy);
app.use('/mobile-bff/tasks', standardProxy);
app.use('/mobile-bff/quests', standardProxy);
app.use('/mobile-bff/meals', standardProxy);

// Error handling
app.use(globalErrorHandler);

// =============================================================================
// WEBSOCKET SETUP
// =============================================================================
// Create Socket.IO server for mobile clients
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all origins for mobile development
        methods: ['GET', 'POST']
    }
});

// Connect to the main API's Socket.IO server
const apiSocket = ioClient(API_BASE_URL.replace('/api/v1', ''), {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

apiSocket.on('connect', () => {
    logger.info('Connected to API Socket.IO server');
});

apiSocket.on('disconnect', () => {
    logger.warn('Disconnected from API Socket.IO server');
});

apiSocket.on('connect_error', (error) => {
    logger.error('API Socket connection error', { error: error.message });
});

// Handle mobile client connections
io.on('connection', (socket) => {
    logger.info('Mobile client connected', { socketId: socket.id });

    // Forward all events from mobile client to API
    socket.onAny((eventName, ...args) => {
        logger.debug(`Mobile → API: ${eventName}`, { args });
        apiSocket.emit(eventName, ...args);
    });

    // Forward all events from API to this specific mobile client
    const forwardToMobile = (eventName: string, ...args: unknown[]) => {
        logger.debug(`API → Mobile: ${eventName}`, { args });
        socket.emit(eventName, ...args);
    };

    apiSocket.onAny(forwardToMobile);

    socket.on('disconnect', () => {
        logger.info('Mobile client disconnected', { socketId: socket.id });
        apiSocket.offAny(forwardToMobile);
    });
});

// Start server
httpServer.listen(PORT, () => {
    logger.info(`Mobile BFF running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info('WebSocket server ready');
});
