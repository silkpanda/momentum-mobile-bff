import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ClientSocket } from 'socket.io-client';
import { checkApiHealth } from './lib/apiClient.js';

// Kiosk Controllers
import { getKioskData } from './controllers/kioskController.js';
import { getHouseholdById } from './controllers/householdController.js';
import { completeTask, getTasks } from './controllers/taskController.js';
import { getRewards, purchaseReward } from './controllers/storeController.js';
import { login } from './controllers/authController.js';

// Admin Controllers
import * as taskAdmin from './controllers/taskAdminController.js';
import * as storeAdmin from './controllers/storeAdminController.js';
import * as memberAdmin from './controllers/memberAdminController.js';

const app = express();
const httpServer = createServer(app);

// 1. Setup Socket.io Server (for Mobile App to connect to)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Support both transports
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io/' // Explicit path
});

// 2. Connect to Core API (as a client)
const CORE_API_URL = process.env.MOMENTUM_API_URL || 'http://localhost:3000';
const coreSocket = ClientSocket(CORE_API_URL);

coreSocket.on('connect', () => {
  console.log(`[BFF] Connected to Core API WebSocket at ${CORE_API_URL}`);
});

coreSocket.on('task_updated', (data) => {
  console.log('[BFF] 🔔 Received task_updated from Core API');
  console.log('[BFF] Event data:', JSON.stringify(data, null, 2));
  console.log('[BFF] Re-emitting to Mobile clients...');
  io.emit('task_updated', data);
  console.log('[BFF] ✅ Event re-emitted to mobile clients');
});

io.on('connection', (socket) => {
  console.log('[BFF] 📱 Mobile Client connected:', socket.id);
  console.log('[BFF] Client transport:', socket.conn.transport.name);

  socket.conn.on('upgrade', (transport) => {
    console.log('[BFF] ⬆️ Client upgraded transport to:', transport.name);
  });

  socket.on('disconnect', () => {
    console.log('[BFF] Mobile Client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

// --- DEBUGGING MIDDLEWARE ---
app.use((req, res, next) => {
  console.log(`[BFF] Incoming Request: ${req.method} ${req.url}`);
  next();
});

// --- API Routes ---
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Momentum Mobile BFF is running!' });
});

app.post('/api/v1/auth/login', login);
app.get('/api/v1/household/:id', getHouseholdById);
app.get('/api/v1/kiosk-data', getKioskData);

// --- THE CRITICAL ROUTE ---
console.log("--> REGISTERING GET /api/v1/tasks <--");
app.get('/api/v1/tasks', getTasks);
// --------------------------

app.post('/api/v1/tasks/:id/complete', completeTask);
app.get('/api/v1/rewards', getRewards);
app.get('/api/v1/store-items', getRewards);
app.post('/api/v1/rewards/:id/purchase', purchaseReward);
app.post('/api/v1/store-items/:id/purchase', purchaseReward);

// Admin Routes
app.get('/api/v1/admin/tasks/pending', taskAdmin.getPendingTasks);
app.post('/api/v1/admin/tasks/:id/approve', taskAdmin.approveTask);
app.post('/api/v1/admin/tasks', taskAdmin.createTask);
app.put('/api/v1/admin/tasks/:id', taskAdmin.updateTask);
app.patch('/api/v1/admin/tasks/:id', taskAdmin.updateTask); // Support PATCH for partial updates
app.delete('/api/v1/admin/tasks/:id', taskAdmin.deleteTask);

app.post('/api/v1/admin/store-items', storeAdmin.createStoreItem);
app.put('/api/v1/admin/store-items/:id', storeAdmin.updateStoreItem);
app.delete('/api/v1/admin/store-items/:id', storeAdmin.deleteStoreItem);

app.post('/api/v1/admin/households/:id/members', memberAdmin.addMember);
app.put('/api/v1/admin/households/:id/members/:memberId', memberAdmin.updateMember);
app.delete('/api/v1/admin/households/:id/members/:memberId', memberAdmin.removeMember);

const PORT = process.env.PORT || 3002;

// Use httpServer.listen instead of app.listen
httpServer.listen(PORT, () => {
  console.log(`[momentum-mobile-bff] Server is running on port ${PORT} 🚀`);
  console.log(`[BFF] Routes registered. Waiting for requests...`);
  checkApiHealth();
});

export default app;