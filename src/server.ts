// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PORT } from './utils/config';

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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mobile BFF running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
});
