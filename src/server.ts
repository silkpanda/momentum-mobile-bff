// src/server.ts
// CRITICAL: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Validate Required Environment Variables
const requiredEnvVars = [
    'API_BASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file before starting the server.');
    process.exit(1);
}

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
import calendarRoutes from './routes/calendar';
// Note: tasks, quests, store, meals, auth are now handled by proxy middleware

// Read API_BASE_URL after dotenv has loaded
let API_BASE_URL = process.env.API_BASE_URL || 'https://momentum-api-vpke.onrender.com/api/v1';

// Safety check: Prevent infinite proxy loop if API_BASE_URL points to the BFF itself
if (API_BASE_URL.includes('momentum-mobile-bff.onrender.com')) {
    console.error('CRITICAL ERROR: API_BASE_URL points to the BFF itself. Falling back to default Core API URL.');
    API_BASE_URL = 'https://momentum-api-vpke.onrender.com/api/v1';
}

// Log the configuration at startup
console.log('='.repeat(60));
console.log('Mobile BFF Configuration:');
console.log(`API_BASE_URL: ${API_BASE_URL}`);
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('='.repeat(60));

const app = express();
// Enable trust proxy for Render/Cloudflare load balancers
// This ensures req.ip and rate limiting work correctly
app.set('trust proxy', 1);

const httpServer = createServer(app);

// Middleware
// CORS Configuration - Hardened for security
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:8081', // Expo dev server
        'exp://localhost:8081', // Expo Go
        'http://localhost:19000', // Expo web
        'http://localhost:19006', // Expo web alternative
        'https://momentum-web.onrender.com', // Production web app
    ];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// CRITICAL: Only parse JSON for non-proxy routes
// Proxy routes need the raw stream, so we skip body parsing for them
const jsonParser = express.json();
app.use((req, res, next) => {
    if (req.path.startsWith('/mobile-bff/auth') ||
        req.path.startsWith('/mobile-bff/tasks') ||
        req.path.startsWith('/mobile-bff/quests') ||
        req.path.startsWith('/mobile-bff/meals') ||
        req.path.startsWith('/mobile-bff/household') || // Covers both /household and /households
        req.path.startsWith('/mobile-bff/routines') ||
        req.path.startsWith('/mobile-bff/wishlist') ||
        req.path.startsWith('/mobile-bff/store') ||
        req.path.startsWith('/mobile-bff/pin')) {
        next();
    } else {
        jsonParser(req, res, next);
    }
});

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
        // Body might be undefined if not parsed, which is expected for proxy routes
        if (req.body && Object.keys(req.body).length > 0) {
            logger.info(`  Body: ${JSON.stringify(req.body)}`);
        } else {
            logger.info(`  Body: (raw stream)`);
        }
        logger.info('='.repeat(60));
    }
    next();
});

// Import rate limit protection
import { rateLimitProtection } from './middleware/rateLimitProtection';

// Apply rate limit protection to all BFF routes
app.use('/mobile-bff', rateLimitProtection);

// DEPRECATION WARNING: Log usage of routes that have moved to Direct Core API
app.use((req, res, next) => {
    if (req.path.startsWith('/mobile-bff/auth') || req.path.startsWith('/mobile-bff/tasks')) {
        logger.warn(`[DEPRECATED] Request to ${req.path} should now go directly to Core API.`);
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
app.use('/mobile-bff/calendar', calendarRoutes);

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
// Matches: /mobile-bff/auth, /mobile-bff/tasks, /mobile-bff/quests, /mobile-bff/meals, /mobile-bff/households
logger.info(`Creating standard proxy with base: ${API_BASE_DOMAIN}, full target: ${API_BASE_URL}`);

// =============================================================================
const standardProxy = createProxyMiddleware({
    target: API_BASE_DOMAIN, // Just the domain: https://momentum-api-vpkw.onrender.com
    changeOrigin: true,
    timeout: 120000, // 120 seconds for slow Render cold starts
    proxyTimeout: 120000,
    pathRewrite: (path, req) => {
        // Express has already stripped the mount path (/mobile-bff)
        // So path is /auth/login, /tasks, etc.
        // We just need to prepend /api/v1
        const newPath = `/api/v1${path}`;
        logger.info(`[PATH REWRITE] Original: ${path} -> New: ${newPath}`);
        return newPath;
    }
});

// Wrap the proxy with custom logging
const loggedProxy = (req: any, res: any, next: any) => {
    const originalPath = req.originalUrl; // Full original URL
    const mountPath = req.baseUrl; // The mount path (e.g., /mobile-bff)
    const relativePath = req.path; // Path relative to mount (e.g., /auth/login)
    const targetPath = `/api/v1${relativePath}`;
    const targetUrl = `${API_BASE_DOMAIN}${targetPath}`;

    logger.info('[PROXY] About to proxy request:');
    logger.info(`  Original URL: ${originalPath}`);
    logger.info(`  Mount Path: ${mountPath}`);
    logger.info(`  Relative Path: ${relativePath}`);
    logger.info(`  Target URL: ${targetUrl}`);

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

// Mount at /mobile-bff to catch all remaining routes (auth, tasks, quests, meals)
// Note: Custom routes and store proxy are defined above and will take precedence
app.use('/mobile-bff', loggedProxy);

// Error handling
app.use(globalErrorHandler);

// =============================================================================
// Create Socket.IO server for mobile clients
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Handle mobile client connections
io.on('connection', (clientSocket) => {
    logger.info('Mobile client connected', { socketId: clientSocket.id });

    // Create a dedicated connection to the Core API for this client
    // This ensures that when this client joins a room (e.g. household),
    // only this specific upstream connection receives those events.
    const upstreamSocket = ioClient(API_BASE_URL.replace('/api/v1', ''), {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        // Pass the auth token from the mobile client to the Core API
        auth: {
            token: clientSocket.handshake.auth?.token
        }
    });

    upstreamSocket.on('connect', () => {
        logger.debug(`Upstream socket connected for client ${clientSocket.id}`);
    });

    upstreamSocket.on('connect_error', (err) => {
        logger.error(`Upstream socket error for client ${clientSocket.id}:`, { error: err.message });
    });

    // Forward events: Mobile -> BFF -> Core API
    clientSocket.onAny((eventName, ...args) => {
        logger.debug(`Mobile → API: ${eventName}`, { args });
        upstreamSocket.emit(eventName, ...args);
    });

    // Forward events: Core API -> BFF -> Mobile
    upstreamSocket.onAny((eventName, ...args) => {
        logger.debug(`API → Mobile: ${eventName}`, { args });
        clientSocket.emit(eventName, ...args);
    });

    // Cleanup
    clientSocket.on('disconnect', () => {
        logger.info('Mobile client disconnected', { socketId: clientSocket.id });
        upstreamSocket.disconnect();
    });
});

// Start server
httpServer.listen(PORT, () => {
    logger.info(`Mobile BFF running on port ${PORT}`);
    logger.info(`API_BASE_URL: ${API_BASE_URL}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info('WebSocket server ready');
});
