import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { checkApiHealth } from './lib/apiClient.js';

// Kiosk Controllers
import { getKioskData } from './controllers/kioskController.js';
import { getHouseholdById } from './controllers/householdController.js';
import { completeTask } from './controllers/taskController.js';
import { getRewards, purchaseReward } from './controllers/storeController.js';

// Admin Controllers (FLAT IMPORT)
import * as taskAdmin from './controllers/taskAdminController.js';
import * as storeAdmin from './controllers/storeAdminController.js';
import * as memberAdmin from './controllers/memberAdminController.js';

// Create the express app
const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---

// Health check for the BFF itself
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Momentum Mobile BFF is running!',
  });
});

// ==========================================
// PHASE 1 & 2: KIOSK & FAMILY VIEW (Emotional)
// ==========================================

// Step 1.5: Household/Profile Selection
app.get('/api/v1/household/:id', getHouseholdById);

// Step 2.1: Kiosk Data Aggregation
app.get('/api/v1/kiosk-data', getKioskData);

// Step 2.3: Task Completion (Child Action)
app.post('/api/v1/tasks/:id/complete', completeTask);

// Step 2.1 & 2.5: Rewards & Store (Child Action)
app.get('/api/v1/rewards', getRewards);
app.post('/api/v1/rewards/:id/purchase', purchaseReward);


// ==========================================
// PHASE 3: PARENT ADMIN VIEW (Rational)
// ==========================================

// --- Task Administration ---
app.get('/api/v1/admin/tasks/pending', taskAdmin.getPendingTasks); // The Approval Queue
app.post('/api/v1/admin/tasks/:id/approve', taskAdmin.approveTask); // Approve Action
app.post('/api/v1/admin/tasks', taskAdmin.createTask);
app.put('/api/v1/admin/tasks/:id', taskAdmin.updateTask); // Proxies to PATCH
app.delete('/api/v1/admin/tasks/:id', taskAdmin.deleteTask);

// --- Store Administration ---
app.post('/api/v1/admin/store-items', storeAdmin.createStoreItem);
app.put('/api/v1/admin/store-items/:id', storeAdmin.updateStoreItem); // Proxies to PATCH
app.delete('/api/v1/admin/store-items/:id', storeAdmin.deleteStoreItem);

// --- Member Administration ---
app.post('/api/v1/admin/households/:id/members', memberAdmin.addMember);
app.put('/api/v1/admin/households/:id/members/:memberId', memberAdmin.updateMember); // Proxies to PATCH
app.delete('/api/v1/admin/households/:id/members/:memberId', memberAdmin.removeMember);


// --- Start the Server ---
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[momentum-mobile-bff] Server is running on port ${PORT} 🚀`);

  // Run a health check against the internal API on startup
  (async () => {
    console.log(
      '[momentum-mobile-bff] Pinging internal API for health check...',
    );
    await checkApiHealth();
  })();
});

// Export the app (useful for serverless functions later)
export default app;