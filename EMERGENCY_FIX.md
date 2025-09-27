# 🚨 EMERGENCY FIX: Database Still Using Old Connection

## THE PROBLEM
The Supabase integration didn't set the new environment variables, so Vercel is still using the old DATABASE_URL.

## IMMEDIATE FIX - DO THIS NOW IN VERCEL:

### Step 1: Check Your Current Variables
Go to Vercel Dashboard → Settings → Environment Variables

Do you see these?
- [ ] POSTGRES_URL
- [ ] POSTGRES_PRISMA_URL
- [ ] POSTGRES_URL_NON_POOLING

### IF NO: The Integration Failed

You have 2 options:

#### Option A: Fix the Integration
1. Go to Settings → Integrations
2. Click on Supabase integration
3. Make sure your project is connected
4. Click "Sync Environment Variables"

#### Option B: Manual Override (FASTEST)
1. In Vercel Environment Variables
2. **UPDATE** these variables (don't delete, just update the values):

```
DATABASE_URL=postgresql://postgres.xaydusadyemjlbhrkaxd:AXvz9QLt9YjAeNgg@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=300

DIRECT_URL=postgresql://postgres.xaydusadyemjlbhrkaxd:AXvz9QLt9YjAeNgg@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**IMPORTANT**:
- Notice the format change from `db.` to `aws-0-us-east-1.pooler.`
- Port 6543 for DATABASE_URL (with pgbouncer=true)
- Port 5432 for DIRECT_URL

### Step 2: Find Your Actual Connection String

If the above doesn't work because of wrong region:

1. Go to Supabase Dashboard
2. Click the "Connect" button (top of page)
3. Look for "Connection Pooling" or "Pooler" section
4. Copy the connection string with port 6543
5. Paste it as DATABASE_URL in Vercel

### Step 3: Redeploy
After updating variables, redeploy immediately.

## WHY THIS IS HAPPENING

1. The Supabase integration should have added POSTGRES_* variables
2. Our code now looks for those variables
3. But if they don't exist, Prisma falls back to DATABASE_URL
4. Your DATABASE_URL still has the old format
5. That's why it's trying to connect to db.xaydusadyemjlbhrkaxd.supabase.co

## VERIFICATION

After fixing and redeploying:
1. Check `/api/test/db-connection`
2. It should show the new pooler.supabase.com format
3. Database should connect successfully