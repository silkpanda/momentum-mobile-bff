// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { PORT, API_BASE_URL } from './utils/config';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import familyRoutes from './routes/family';
import tasksRoutes from './routes/tasks';
import questsRoutes from './routes/quests';
import storeRoutes from './routes/store';
import membersRoutes from './routes/members';
import mealsRoutes from './routes/meals';

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
    console.log(`[Mobile BFF] ${req.method} ${req.path}`);
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
app.use('/mobile-bff/auth', authRoutes);
app.use('/mobile-bff/dashboard', dashboardRoutes);
app.use('/mobile-bff/family', familyRoutes);
app.use('/mobile-bff/tasks', tasksRoutes);
app.use('/mobile-bff/quests', questsRoutes);
app.use('/mobile-bff/store', storeRoutes);
app.use('/mobile-bff/members', membersRoutes);
app.use('/mobile-bff/meals', mealsRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Mobile BFF Error]:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

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
    console.log('🔌 Connected to API Socket.IO server');
});

apiSocket.on('disconnect', () => {
    console.log('❌ Disconnected from API Socket.IO server');
});

apiSocket.on('connect_error', (error) => {
    console.error('API Socket connection error:', error);
});

// Handle mobile client connections
io.on('connection', (socket) => {
    console.log('📱 Mobile client connected:', socket.id);

    // Forward all events from mobile client to API
    socket.onAny((eventName, ...args) => {
        console.log(`[Mobile → API] ${eventName}`, args);
        apiSocket.emit(eventName, ...args);
    });

    // Forward all events from API to this specific mobile client
    const forwardToMobile = (eventName: string, ...args: any[]) => {
        console.log(`[API → Mobile] ${eventName}`, args);
        socket.emit(eventName, ...args);
    };

    apiSocket.onAny(forwardToMobile);

    socket.on('disconnect', () => {
        console.log('📱 Mobile client disconnected:', socket.id);
        apiSocket.offAny(forwardToMobile);
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Mobile BFF running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket server ready`);
});
