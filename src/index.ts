import express from 'express';
import cors from 'cors';
import 'dotenv/config';
// --- THIS IS THE FIX ---
// The import path is now all lowercase to match
// the file name 'apiclient.ts' on your disk.
import { checkApiHealth } from './lib/apiclient.js';
// --- END OF FIX ---

// Create the express app
const app = express();

// --- Global Middleware ---

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// --- Basic Health Check Route ---
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Momentum Mobile BFF is running!',
  });
});

// --- Start the Server ---
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[momentum-mobile-bff] Server is running on port ${PORT} 🚀`);

  // Run a health check against the internal API on startup
  // We use an IIFE (Immediately Invoked Function Expression) to run async code
  (async () => {
    console.log(
      '[momentum-mobile-bff] Pinging internal API for health check...',
    );
    await checkApiHealth();
  })();
});

// Export the app (useful for serverless functions later)
export default app;