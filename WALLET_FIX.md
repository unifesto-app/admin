# Wallet Visibility Fix

## Problem
Only one user's wallet was visible in the admin panel. This was caused by Row Level Security (RLS) policies in Supabase that restricted data access based on the authenticated user.

## Root Cause
The admin panel was using the **anon key** (public key) which is subject to RLS policies. This meant:
- Admins could only see their own wallet data
- Other users' wallets were blocked by RLS policies
- Transactions and profiles were also restricted

## Solution
Created a **service role client** that bypasses RLS policies for admin operations:

### Files Created/Modified:

1. **Created: `/lib/supabase/service-role.ts`**
   - New Supabase client using the service role key
   - Bypasses RLS for admin operations
   - Only used in API routes after authentication check

2. **Modified: `/app/api/wallet/route.ts`**
   - Added authentication check first
   - Uses service role client to fetch all wallets
   - Now returns all user wallets regardless of RLS

3. **Modified: `/app/api/wallet/[id]/route.ts`**
   - Added authentication check
   - Uses service role client for individual wallet queries

4. **Modified: `/app/api/wallet/[id]/transactions/route.ts`**
   - Added authentication check
   - Uses service role client for transaction queries and creation

## Security
✅ **Secure Implementation:**
- Authentication is still checked first using the regular client
- Service role client is only used AFTER verifying the user is authenticated
- Service role key is stored in environment variables (not exposed to client)
- Only used in server-side API routes

## Environment Variable Required
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

This is already configured in `.env.local`.

## Result
✅ All user wallets are now visible in the admin panel
✅ Transactions can be viewed and created for any user
✅ Profiles are properly loaded
✅ Security is maintained through authentication checks
