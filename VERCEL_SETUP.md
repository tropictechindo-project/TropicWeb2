# Vercel Deployment & Environment Variables Guide

If products and packages are not appearing in production, it is likely due to missing or incorrect environment variables in your Vercel project settings.

## 1. Required Supabase Variables
Ensure these are set to match your Supabase project (Project Settings > API):

| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `DATABASE_URL` | Connection string (Transaction mode, pgbouncer) |
| `DIRECT_URL` | Connection string (Session mode, direct) for migrations |

## 2. Authentication & Site Configuration
Crucial for JWT verification and domain-specific logic:

| Key | Description |
|-----|-------------|
| `JWT_SECRET` | Must match your Supabase JWT Secret |
| `NEXT_PUBLIC_SITE_URL` | `https://testdomain.fun` |
| `NEXTAUTH_URL` | `https://testdomain.fun` |

## 3. Product Synchronization Step
If the database is connected but products don't appear, ensure you have run the migrations and seed data on the production database:

```bash
# Run this from your local machine targeting the production DATABASE_URL
npx prisma migrate deploy
```

## 4. Supabase Dashboard Settings
In the Supabase Dashboard, go to **Authentication > Settings > Site URL**:
1. **Site URL**: `https://testdomain.fun`
2. **Redirect URLs**: Add `https://testdomain.fun/**`
