// src/server.ts
// CRITICAL: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { PORT } from './utils/config';
import logger from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';

// Import routes (Custom Aggregation Logic)
import dashboardRoutes from './routes/dashboard';
import familyRoutes from './routes/family';
import membersRoutes from './routes/members';
// Note: tasks, quests, store, meals, auth are now handled by proxy middleware

// Read API_BASE_URL after dotenv has loaded
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

// Log the configuration at startup
console.log('='.repeat(60));
console.log('Mobile BFF Configuration:');
console.log(`API_BASE_URL: ${API_BASE_URL}`);
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('='.repeat(60));

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

// Detailed request logging for debugging proxy issues
app.use((req, res, next) => {
    if (req.path.startsWith('/mobile-bff/')) {
        logger.info('='.repeat(60));
        logger.info(`[REQUEST DETAILS]`);
        logger.info(`  Method: ${req.method}`);
        logger.info(`  Original URL: ${req.originalUrl}`);
        logger.info(`  Path: ${req.path}`);
        logger.info(`  Headers: ${JSON.stringify(req.headers, null, 2)}`);
        logger.info(`  Body: ${JSON.stringify(req.body)}`);
        logger.info('='.repeat(60));
    }
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

// Debug endpoint to check configuration
app.get('/debug', (req, res) => {
    res.json({
        service: 'momentum-mobile-bff',
        apiBaseUrl: API_BASE_URL,
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Routes
// Custom Routes (Aggregation/Transformation)
app.use('/mobile-bff/dashboard', dashboardRoutes);
app.use('/mobile-bff/family', familyRoutes);
app.use('/mobile-bff/members', membersRoutes);

// Proxy Routes (Direct API Mapping)
// Extract base URL without /api/v1 path for proxy target
const API_BASE_DOMAIN = API_BASE_URL.replace('/api/v1', '');

// 1. Store (Special mapping: /store -> /store-items)
app.use('/mobile-bff/store', createProxyMiddleware({
    target: API_BASE_DOMAIN,
    changeOrigin: true,
    timeout: 120000,
    proxyTimeout: 120000,
    pathRewrite: (path, req) => {
        // Express strips /mobile-bff/store, so path is relative (e.g., /123)
        // We need to map it to /api/v1/store-items/123
        const newPath = `/api/v1/store-items${path}`;
        logger.info(`[STORE REWRITE] Original: ${path} -> New: ${newPath}`);
        return newPath;
    }
}));

// 2. Standard Routes (Direct mapping)
// Matches: /mobile-bff/auth, /mobile-bff/tasks, /mobile-bff/quests, /mobile-bff/meals
logger.info(`Creating standard proxy with base: ${API_BASE_DOMAIN}, full target: ${API_BASE_URL}`);

const standardProxy = createProxyMiddleware({
    target: API_BASE_DOMAIN, // Just the domain: https://momentum-api-vpkw.onrender.com
    changeOrigin: true,
    timeout: 120000, // 120 seconds for slow Render cold starts
    proxyTimeout: 120000,
    pathRewrite: (path, req) => {
        // Express has already stripped the mount path (/mobile-bff/auth, etc.)
        // So path is already relative (e.g., /login)
        // We just need to prepend /api/v1
        const newPath = `/api/v1${path}`;
        logger.info(`[PATH REWRITE] Original: ${path} -> New: ${newPath}`);
        return newPath;
    }
});

// Wrap the proxy with custom logging
const loggedProxy = (req: any, res: any, next: any) => {
    const originalPath = req.path;
    const rewrittenPath = originalPath.replace(/^\/mobile-bff/, '/api/v1');
    const targetUrl = `${API_BASE_DOMAIN}${rewrittenPath}`;

    logger.info('[PROXY] About to proxy request:');
    logger.info(`  From: ${req.method} ${originalPath}`);
    logger.info(`  To: ${req.method} ${targetUrl}`);
    logger.info(`  Target Domain: ${API_BASE_DOMAIN}`);
    logger.info(`  Rewritten Path: ${rewrittenPath}`);

    // Capture response
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (data: any) {
        logger.info(`[PROXY] Response sent: ${res.statusCode}`);
        return originalSend.call(this, data);
    };

    res.json = function (data: any) {
        logger.info(`[PROXY] JSON Response sent: ${res.statusCode}`);
        logger.info(`[PROXY] Response data: ${JSON.stringify(data).substring(0, 200)}`);
        return originalJson.call(this, data);
    };

    standardProxy(req, res, next);
};

app.use('/mobile-bff/auth', loggedProxy);
app.use('/mobile-bff/tasks', loggedProxy);
app.use('/mobile-bff/quests', loggedProxy);
app.use('/mobile-bff/meals', loggedProxy);

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
    logger.info(`API_BASE_URL: ${API_BASE_URL}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info('WebSocket server ready');
});
