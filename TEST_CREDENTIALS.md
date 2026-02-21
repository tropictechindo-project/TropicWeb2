# Test User Credentials

## Worker Dashboard Access
- **Email**: `worker@testdomain.fun`
- **Password**: `Worker2026`
- **Role**: WORKER
- **Dashboard URL**: `/dashboard/worker`

## User Dashboard Access
- **Email**: `user@testdomain.fun`
- **Password**: `User2026`
- **Role**: USER
- **Dashboard URL**: `/dashboard/user`

## How to Add to Supabase

1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `prisma/add_test_users.sql`
4. Run the SQL script
5. The users will be created (or updated if they already exist)

## Login
Visit `/auth/login` and use the credentials above to access the respective dashboards.
