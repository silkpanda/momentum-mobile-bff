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
import * as questController from './controllers/questController.js';
import * as routineController from './controllers/routineController.js';
import * as mealController from './controllers/mealController.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
const coreSocket = ClientSocket(CORE_API_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

coreSocket.on('connect', () => {
  console.log(`[BFF] Connected to Core API WebSocket at ${CORE_API_URL}`);
});

coreSocket.on('connect_error', (err) => {
  console.error('[BFF] Core API Socket Connection Error:', err.message);
});

coreSocket.on('task_updated', (data) => {
  console.log('[BFF] 🔔 Received task_updated from Core API');
  console.log('[BFF] Event data:', JSON.stringify(data, null, 2));
  console.log('[BFF] Re-emitting to Mobile clients...');
  io.emit('task_updated', data);
  console.log('[BFF] ✅ Event re-emitted to mobile clients');
});

// Relay 'quest_updated' events to mobile clients
coreSocket.on('quest_updated', (data) => {
  console.log('[BFF] Received quest_updated from Core, relaying to clients:', data);
  io.emit('quest_updated', data);
});

// Relay 'routine_updated' events to mobile clients
coreSocket.on('routine_updated', (data) => {
  console.log('[BFF] Received routine_updated from Core, relaying to clients:', data);
  io.emit('routine_updated', data);
});

// Relay 'member_points_updated' events
coreSocket.on('member_points_updated', (data) => {
  console.log('[BFF] Received member_points_updated from Core, relaying to clients:', data);
  io.emit('member_points_updated', data);
});

// --- MEAL PLANNER ROUTES ---
app.get('/api/v1/meals/recipes', mealController.getRecipes);
app.post('/api/v1/meals/recipes', mealController.createRecipe);
app.put('/api/v1/meals/recipes/:id', mealController.updateRecipe);
app.delete('/api/v1/meals/recipes/:id', mealController.deleteRecipe);

app.get('/api/v1/meals/restaurants', mealController.getRestaurants);
app.post('/api/v1/meals/restaurants', mealController.createRestaurant);
app.put('/api/v1/meals/restaurants/:id', mealController.updateRestaurant);
app.delete('/api/v1/meals/restaurants/:id', mealController.deleteRestaurant);

app.get('/api/v1/meals/plans', mealController.getMealPlans);
app.post('/api/v1/meals/plans', mealController.createMealPlan);
app.delete('/api/v1/meals/plans/:id', mealController.deleteMealPlan);

// --- SOCKET.IO ---
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

// Quest Routes
app.get('/api/v1/quests', questController.getAllQuests);
app.post('/api/v1/quests/:id/claim', questController.claimQuest);
app.post('/api/v1/quests/:id/complete', questController.completeQuest);

// Admin Quest Routes
app.post('/api/v1/admin/quests', questController.createQuest);
app.delete('/api/v1/admin/quests/:id', questController.deleteQuest);
app.post('/api/v1/admin/quests/:id/approve', questController.approveQuest);

// Routine Routes
app.get('/api/v1/routines', routineController.getAllRoutines);
app.get('/api/v1/routines/member/:memberId', routineController.getMemberRoutines);
app.post('/api/v1/routines/:id/complete', routineController.completeRoutine);

// Admin Routine Routes
app.post('/api/v1/admin/routines', routineController.createRoutine);
app.put('/api/v1/admin/routines/:id', routineController.updateRoutine);
app.delete('/api/v1/admin/routines/:id', routineController.deleteRoutine);

const PORT = process.env.PORT || 3002;

// Use httpServer.listen instead of app.listen
httpServer.listen(PORT, () => {
  console.log(`[momentum-mobile-bff] Server is running on port ${PORT} 🚀`);
  console.log(`[BFF] Routes registered. Waiting for requests...`);
  checkApiHealth();
});

export default app;