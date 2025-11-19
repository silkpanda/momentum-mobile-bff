import express from 'express';
import cors from 'cors';
import 'dotenv/config';
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
app.post('/api/v1/rewards/:id/purchase', purchaseReward);

// Admin Routes
app.get('/api/v1/admin/tasks/pending', taskAdmin.getPendingTasks);
app.post('/api/v1/admin/tasks/:id/approve', taskAdmin.approveTask);
app.post('/api/v1/admin/tasks', taskAdmin.createTask);
app.put('/api/v1/admin/tasks/:id', taskAdmin.updateTask);
app.delete('/api/v1/admin/tasks/:id', taskAdmin.deleteTask);

app.post('/api/v1/admin/store-items', storeAdmin.createStoreItem);
app.put('/api/v1/admin/store-items/:id', storeAdmin.updateStoreItem);
app.delete('/api/v1/admin/store-items/:id', storeAdmin.deleteStoreItem);

app.post('/api/v1/admin/households/:id/members', memberAdmin.addMember);
app.put('/api/v1/admin/households/:id/members/:memberId', memberAdmin.updateMember);
app.delete('/api/v1/admin/households/:id/members/:memberId', memberAdmin.removeMember);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[momentum-mobile-bff] Server is running on port ${PORT} 🚀`);
  console.log(`[BFF] Routes registered. Waiting for requests...`);
  checkApiHealth();
});

export default app;