# Render Deployment Troubleshooting

## Current Error
```
Error: Cannot find module '/opt/render/project/src/dist/index.js'
```

## Root Cause
The error path `/opt/render/project/src/dist/index.js` is incorrect. The actual entry point is `dist/server.js`.

## Solutions Applied

### 1. Updated render.yaml
- Changed `startCommand` from `npm start` to `node dist/server.js`
- Added explicit `rootDir: .` to ensure correct working directory
- Added `PORT` environment variable set to 10000

### 2. Updated package.json
- Added `engines` field to specify Node.js >= 18.0.0
- Verified `start` script points to `node dist/server.js`

### 3. Created .gitignore
- Ensures build artifacts aren't committed

### 4. Created Procfile
- Backup configuration: `web: node dist/server.js`

## Render Dashboard Configuration

**IMPORTANT: Check your Render dashboard settings!**

The error suggests Render might be using dashboard settings instead of `render.yaml`. Please verify:

1. **Start Command**: Should be `node dist/server.js` (NOT `npm start` or `node dist/index.js`)
2. **Build Command**: Should be `npm install && npm run build`
3. **Root Directory**: Should be empty or `.` (not `src`)

### How to Fix in Render Dashboard:

1. Go to your service in Render dashboard
2. Click "Settings"
3. Scroll to "Build & Deploy"
4. Check these fields:
   - **Root Directory**: Leave blank or set to `.`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
5. Click "Save Changes"
6. Trigger a manual deploy

## Verification Steps

After deployment, check:
1. Build logs show TypeScript compilation completing
2. `dist/server.js` file is created
3. Start command runs `node dist/server.js`
4. Service starts on the correct PORT

## Environment Variables Required

- `NODE_ENV`: production
- `API_BASE_URL`: URL of your momentum-api service
- `PORT`: 10000 (or Render's default)
