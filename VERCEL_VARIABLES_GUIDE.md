# Vercel Environment Variables Guide

## Variables Set by Supabase Integration

The Supabase-Vercel integration has created these variables. Here's which ones need values:

### 🔴 CRITICAL - Must Have Values:

#### `POSTGRES_PRISMA_URL`
**Current Status:** Check if empty
**What it should contain:** Connection string with pooling for Prisma
**Format:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```
**How to get it:**
1. Go to Supabase Dashboard → Settings → Database
2. Look for "Connection string" or "Connection pooling"
3. Use the "Transaction" mode connection (port 6543)
4. Add `?pgbouncer=true` at the end

#### `POSTGRES_URL_NON_POOLING`
**Current Status:** Check if empty
**What it should contain:** Direct connection for migrations
**Format:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```
**How to get it:**
1. Same location in Supabase
2. Use the "Session" or "Direct" connection (port 5432)

### 🟡 OPTIONAL - Only if Using Supabase Client Features:

#### `NEXT_PUBLIC_SUPABASE_URL`
**What it should contain:** Your Supabase project URL
**Format:** `https://[PROJECT_REF].supabase.co`
**Where to find:** Supabase Dashboard → Settings → API → Project URL

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**What it should contain:** Your public anonymous key
**Where to find:** Supabase Dashboard → Settings → API → Project API keys → anon public

#### `SUPABASE_SERVICE_ROLE_KEY`
**What it should contain:** Your service role key (keep secret!)
**Where to find:** Supabase Dashboard → Settings → API → Project API keys → service_role

### 🟢 AUTOMATICALLY FILLED - Should Already Have Values:

These are typically auto-filled by the integration:
- `POSTGRES_USER` - Usually "postgres"
- `POSTGRES_HOST` - The database host
- `POSTGRES_PASSWORD` - Your database password
- `POSTGRES_DATABASE` - Usually "postgres"

### 📝 How to Update Empty Variables:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click on any empty variable
3. Add the value according to the guide above
4. Make sure to apply to all environments (Production, Preview, Development)
5. Save and redeploy

## Quick Check Commands

After setting variables, test with:
```
/api/test/db-connection
```

This will show you which variables are set and if the connection works.

## Example Values

For project `xaydusadyemjlbhrkaxd` in `us-east-1`:

```bash
POSTGRES_PRISMA_URL=postgresql://postgres.xaydusadyemjlbhrkaxd:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

POSTGRES_URL_NON_POOLING=postgresql://postgres.xaydusadyemjlbhrkaxd:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://xaydusadyemjlbhrkaxd.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your anon key from Supabase dashboard]
```

Replace `[YOUR_PASSWORD]` with your actual database password from Supabase.