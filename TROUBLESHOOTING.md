# Troubleshooting Guide

## Build Cache Corruption Issues

### Problem: ENOENT routes-manifest.json Errors

**Symptoms:**
```
⨯ [Error: ENOENT: no such file or directory, open '.next\routes-manifest.json']
GET /admin 500 in 6330ms
GET /api/v1/schedule/today 500 in 7999ms
```

**Root Cause:**
The `.next` build cache becomes corrupted, causing Next.js to look for non-existent manifest files.

**Solution:**
1. Kill all Node.js development servers
2. Delete corrupted build cache completely:
```bash
# Windows PowerShell
powershell -Command "if (Test-Path .next) { Remove-Item .next -Recurse -Force }"
powershell -Command "if (Test-Path node_modules/.cache) { Remove-Item node_modules/.cache -Recurse -Force }"

# Linux/Mac
rm -rf .next
rm -rf node_modules/.cache
```
3. Clear npm cache:
```bash
npm cache clean --force
```
4. Restart development server:
```bash
npm run dev
```

**Browser Cache Fix:**
After fixing server-side issues, browsers may show `ChunkLoadError` due to cached JavaScript files. Fix with:
- Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Or open in incognito/private window

### Problem: Port Already in Use

**Symptoms:**
```
⚠ Port 3000 is in use by process 46056, using available port 3001 instead.
```

**Solution:**
```bash
# Windows - Kill specific port
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill all Node processes (use with caution)
taskkill /F /IM node.exe
```

## Development Best Practices

### Clean Development Environment
When experiencing persistent issues:

1. **Full Clean:**
```bash
npm run dev # Stop server (Ctrl+C)
rm -rf .next
rm -rf node_modules/.cache  
npm cache clean --force
npm run dev # Restart fresh
```

2. **Database Reset (if needed):**
```bash
npx prisma db push --force-reset
npx prisma db seed
```

3. **Environment Check:**
```bash
# Verify environment variables
cat .env.local

# Check Node/npm versions
node --version
npm --version
```

### Preventing Build Cache Corruption

1. Always use `Ctrl+C` to stop development server properly
2. Don't force-kill Node processes unless necessary
3. Keep `.next` in `.gitignore` (never commit build cache)
4. Run `npm cache clean --force` periodically
5. Use `npm ci` instead of `npm install` in production

---

**Last Updated:** September 2025
**Applies to:** Next.js 15.5.0, Node.js 18+