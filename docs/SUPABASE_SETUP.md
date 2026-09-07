# Supabase Setup Guide

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Sign up" → Create account with GitHub or email
3. Verify your email if using email signup

## Step 2: Create New Project

1. Click "New Project"
2. Enter project details:
   - **Name**: Project Pulse (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait for project to be provisioned (~2 minutes)

## Step 3: Get API Credentials

After project is created:

1. Go to **Settings** → **API**
2. Find these values:

| Variable | Location |
|----------|----------|
| `SUPABASE_URL` | "Project URL" field |
| `SUPABASE_SECRET_KEY` | "secret" key under "Project API keys" (newer key system) |

**⚠️ Important**: Use the `secret` key for the backend. It is the modern replacement for `service_role`. The `anon`/`publishable` key is for frontend only.

## Step 4: Configure Backend

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development

# From Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 5: Deploy Database Schema

### Option A: Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase project
2. Copy the entire contents of `database/schema.sql`
3. Paste into the SQL Editor
4. Click **Run**

### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Push schema
supabase db push
```

## Step 6: Verify Connection

Start the backend:

```bash
cd backend
npm install
npm start
```

Test the health endpoint with database status:

```bash
curl http://localhost:3001/api/health/full
```

Expected response:
```json
{
  "status": "ok",
  "service": "project-pulse-backend",
  "database": {
    "provider": "Supabase",
    "connected": true
  }
}
```

## Security Notes

- Never commit `.env` files to git
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- The `anon` key can be safely exposed to frontend
- The `service_role` key bypasses Row Level Security (use carefully)

## Troubleshooting

### "Credentials not configured"

Make sure `backend/.env` exists and has the correct values.

### "Connection refused"

Check:
1. Supabase project is not paused
2. IP whitelist includes your IP (if configured)
3. Internet connection is working

### "Invalid API key"

Make sure you're using the correct key:
- `SUPABASE_URL`: Project URL (ends in .supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY`: The long string under "service_role"
