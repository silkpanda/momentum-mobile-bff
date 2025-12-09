// Rate limit protection middleware to prevent BFF from being flagged by Cloudflare
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Simple in-memory cache to deduplicate rapid identical requests
const requestCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_DURATION_MS = 5000; // 5 seconds

// Track request patterns to detect potential issues
const requestPatterns = new Map<string, number[]>();
const PATTERN_WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS_PER_MINUTE = 120; // Restored to 120 after implementing unified data sync (should be plenty now)

/**
 * Middleware to protect against excessive requests that might trigger rate limiting
 */
export const rateLimitProtection = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
    const endpoint = req.path;
    const cacheKey = `${clientIp}:${endpoint}:${JSON.stringify(req.body || {})}`;
    const patternKey = `${clientIp}:${endpoint}`;

    // Whitelist frequently accessed, lightweight endpoints (Auth)
    // Note: Since this middleware is mounted at /mobile-bff, req.path (endpoint) is relative (e.g., /auth/google)
    if (endpoint.startsWith('/auth/')) {
        return next();
    }

    // Check for cached response (deduplication)
    const cached = requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
        logger.info(`[CACHE HIT] Returning cached response for ${endpoint}`);
        return res.json(cached.data);
    }

    // Track request pattern
    const now = Date.now();
    const pattern = requestPatterns.get(patternKey) || [];

    // Remove old timestamps outside the window
    const recentRequests = pattern.filter(timestamp => (now - timestamp) < PATTERN_WINDOW_MS);
    recentRequests.push(now);
    requestPatterns.set(patternKey, recentRequests);

    // Check if pattern exceeds limits
    if (recentRequests.length > MAX_REQUESTS_PER_MINUTE) {
        logger.warn(`[RATE LIMIT] Client ${clientIp} exceeded ${MAX_REQUESTS_PER_MINUTE} requests/min for ${endpoint}`);
        return res.status(429).json({
            status: 'error',
            message: 'Too many requests. Please slow down.',
            retryAfter: 60
        });
    }

    // Intercept response to cache successful results
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
        if (res.statusCode === 200 && data) {
            requestCache.set(cacheKey, { timestamp: Date.now(), data });

            // Clean up old cache entries
            setTimeout(() => {
                requestCache.delete(cacheKey);
            }, CACHE_DURATION_MS);
        }
        return originalJson(data);
    };

    next();
};

// Cleanup function to prevent memory leaks
setInterval(() => {
    const now = Date.now();

    // Clean request patterns
    for (const [key, timestamps] of requestPatterns.entries()) {
        const recent = timestamps.filter(t => (now - t) < PATTERN_WINDOW_MS);
        if (recent.length === 0) {
            requestPatterns.delete(key);
        } else {
            requestPatterns.set(key, recent);
        }
    }

    logger.debug(`Active patterns: ${requestPatterns.size}, Cache size: ${requestCache.size}`);
}, 60000); // Clean every minute
