# Fix for 504 Gateway Timeout Error

## Problem
The mobile app is getting a 504 Gateway Timeout when trying to login. The error message shows:
```
Error occurred while trying to proxy: momentum-mobile-bff.onrender.com/login
```

## Root Cause
The BFF's `API_BASE_URL` environment variable is set correctly in Render (`https://momentum-api-vpke.onrender.com/api/v1`), but the proxy middleware might be timing out or the API might be in a cold start.

## Changes Made

### 1. Mobile App (`momentum-mobile/src/services/api.ts`)
- ✅ Fixed JSON parsing to check response status before parsing
- ✅ Added response cloning to prevent "Already read" errors
- ✅ Better error messages showing actual server responses

### 2. BFF Server (`momentum-mobile-bff/src/server.ts`)
- ✅ Added 60-second timeouts to proxy middleware for Render cold starts
- ✅ Added `/debug` endpoint to verify configuration
- ✅ Added startup logging to show `API_BASE_URL`
- ✅ Added automatic loop prevention if `API_BASE_URL` points to BFF itself

## Next Steps

### Step 1: Verify API is Running
Visit this URL in your browser:
```
https://momentum-api-vpke.onrender.com/api/v1/health
```

You should see:
```json
{"status":"ok"}
```

If you get an error or timeout, the API service needs to be woken up or redeployed.

### Step 2: Deploy BFF Changes
```bash
cd momentum-mobile-bff
git add .
git commit -m "fix: Add timeouts and debug endpoint for proxy middleware"
git push
```

Render will automatically redeploy the BFF.

### Step 3: Check BFF Configuration
After deployment, visit:
```
https://momentum-mobile-bff.onrender.com/debug
```

You should see:
```json
{
  "service": "momentum-mobile-bff",
  "apiBaseUrl": "https://momentum-api-vpke.onrender.com/api/v1",
  "port": 10000,
  "nodeEnv": "production",
  "timestamp": "..."
}
```

Verify that `apiBaseUrl` is correct.

### Step 4: Test Login Again
After both services are deployed and running:
1. Try logging in from the mobile app
2. The first request might take 30-60 seconds (cold start)
3. Subsequent requests should be fast

## Troubleshooting

### If API Health Check Fails
1. Go to Render dashboard
2. Find `momentum-api` service
3. Check if it's running
4. If not, trigger a manual deploy

### If BFF Debug Shows Wrong URL
1. Go to Render dashboard
2. Find `momentum-mobile-bff` service
3. Go to Environment tab
4. Verify `API_BASE_URL` = `https://momentum-api-vpke.onrender.com/api/v1`
5. Save and redeploy

### If Still Getting 504
The API might be taking too long to wake up. Try:
1. Visit the API health endpoint first to wake it up
2. Wait 30 seconds
3. Then try logging in from the mobile app
