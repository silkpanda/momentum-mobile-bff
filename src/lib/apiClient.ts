import axios from 'axios';
import 'dotenv/config';

/**
 * The internal-facing momentum-api (Core Service)
 *
 * This is the ONLY service that talks to the database.
 * Both the Web BFF and Mobile BFF call this service.
 */
const API_BASE_URL = process.env.MOMENTUM_API_URL || 'http://localhost:3001';

/**
 * A pre-configured Axios instance for communicating with the
 * internal momentum-api.
 *
 * This instance can be expanded with shared headers, authentication
 * tokens, or error handling interceptors as the project grows.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // We can add a shared "service-to-service" secret key here
    // 'X-Internal-Secret': process.env.INTERNAL_API_SECRET
  },
});

// --- Health Check Function ---
// Let's add a simple function to test our connection to the API.

/**
 * Pings the momentum-api's health check endpoint.
 * @returns {Promise<boolean>} True if the API is reachable, false otherwise.
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/');
    if (response.status === 200) {
      console.log(
        '[apiClient] momentum-api health check successful.',
        response.data,
      );
      return true;
    }
    return false;
  } catch (error) {
    // --- THIS IS THE FIX ---
    // We must check if 'error' is an 'Error' object before accessing .message
    if (error instanceof Error) {
      console.error(
        '[apiClient] Failed to connect to momentum-api:',
        error.message,
      );
    } else {
      // If it's not a standard error, log the whole thing
      console.error(
        '[apiClient] Failed to connect to momentum-api with an unknown error:',
        error,
      );
    }
    return false;
    // --- END OF FIX ---
  }
};