import express from 'express';
import cors from 'cors';
import 'dotenv/config';
// --- THIS IS THE FIX ---
// Changed to uppercase 'C' to match the file name
import { checkApiHealth } from './lib/apiClient.js';
// --- END OF FIX ---
import { getKioskData } from './controllers/kioskController.js';

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

// --- NEW KIOSK ENDPOINT (STEP 3.1) ---
// This is the main endpoint for the mobile app
app.get('/api/v1/kiosk-data', getKioskData);

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