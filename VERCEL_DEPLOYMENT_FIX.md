# CRITICAL: Vercel Deployment Database Fix

## THE PROBLEM
Your database connection is failing because you're using the **OLD** Supabase connection format that doesn't work with Vercel's serverless environment.

**Current (WRONG):**
```
db.xaydusadyemjlbhrkaxd.supabase.co:5432
```

**Required (CORRECT):**
```
aws-0-[region].pooler.supabase.com:6543
```

## IMMEDIATE ACTIONS REQUIRED

### Step 1: Get Your Correct Connection Strings from Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → Database**
4. Scroll to **"Connection Pooling"** section
5. You will see two connection strings:
   - **Transaction** (uses port 6543) - Copy this for DATABASE_URL
   - **Session** (uses port 5432) - Copy this for DIRECT_URL

### Step 2: Check for IP Bans

1. In the same Database settings page
2. Scroll to **"Network Bans"** section
3. Remove any banned IPs (especially Vercel IPs)

### Step 3: Update Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Update these variables:

```bash
# IMPORTANT: Replace [YOUR_PASSWORD] and [REGION] with your actual values from Supabase

# For serverless functions (Transaction pooling - port 6543)
DATABASE_URL=postgresql://postgres.xaydusadyemjlbhrkaxd:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=300&pool_timeout=300

# For migrations (Session mode - port 5432)
DIRECT_URL=postgresql://postgres.xaydusadyemjlbhrkaxd:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**CRITICAL NOTES:**
- The region is usually `us-east-1` or similar
- Use your actual password from Supabase
- The `pgbouncer=true` parameter is REQUIRED
- The timeouts help prevent connection failures

### Step 4: Update Vercel Build Command

1. In Vercel Settings → General
2. Change the **Build Command** to:
```bash
npx prisma generate && npx prisma migrate deploy && next build
```

### Step 5: Redeploy

1. After updating all environment variables
2. Go to Deployments
3. Click the three dots on your latest deployment
4. Select **"Redeploy"**
5. Choose **"Use existing Build Cache"** = NO

## WHY THIS WORKS

1. **Pooler Endpoint**: The `aws-0-[region].pooler.supabase.com` format is designed for serverless
2. **Transaction Mode (6543)**: Handles the constant connect/disconnect of serverless functions
3. **PgBouncer**: Disables prepared statements that don't work with transaction pooling
4. **Timeouts**: Prevents premature connection failures in serverless environment

## VERIFICATION

After deployment, test these endpoints:
- `/api/test/db-connection` - Should show successful connection
- `/api/v1/projects` - Should return project data
- Your main app should work without "session expired" errors

## IF STILL FAILING

1. **Double-check the connection string format** - It must use `pooler.supabase.com`, not the old format
2. **Verify no IP bans** in Supabase
3. **Check Vercel Function Logs** for detailed errors
4. **Ensure your Supabase project is active** (not paused)

## Environment Variables Summary

You need ALL of these in Vercel (total 12):

### Firebase (6 variables)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_BASE64
```

### Database (2 variables) - THESE ARE THE CRITICAL ONES TO FIX
```
DATABASE_URL  (with pooler.supabase.com:6543)
DIRECT_URL    (with pooler.supabase.com:5432)
```

### Supabase (2 variables)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### App Secrets (2 variables)
```
WEBHOOK_SECRET
JWT_AUDIENCE
```