# Deploy Instructions

## The Fix
Fixed the environment variable loading order in the BFF. The issue was that `API_BASE_URL` was being read before `dotenv.config()` loaded the environment variables, causing it to be undefined.

## Changes Made
- Moved `dotenv.config()` to the very top of `server.ts`
- Read `API_BASE_URL` directly from `process.env` after dotenv loads
- Added startup logging to show the configuration

## Deploy to Render

```bash
cd c:\Users\antho\OneDrive\Desktop\Momentum\momentum-mobile-bff
git add .
git commit -m "fix: Load environment variables before reading API_BASE_URL"
git push
```

## After Deployment

1. Check the Render logs for the BFF service
2. You should see:
   ```
   ============================================================
   Mobile BFF Configuration:
   API_BASE_URL: https://momentum-api-vpkw.onrender.com/api/v1
   PORT: 10000
   NODE_ENV: production
   ============================================================
   ```

3. Try logging in from the mobile app
4. It should work now!

## If It Still Doesn't Work

Visit the debug endpoint to verify:
```
https://momentum-mobile-bff.onrender.com/debug
```

Should show:
```json
{
  "apiBaseUrl": "https://momentum-api-vpkw.onrender.com/api/v1"
}
```
