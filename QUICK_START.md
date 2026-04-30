# Admin Authentication - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Get Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) ⚠️ Keep this secret!

### Step 2: Update Environment Variables
Edit `admin/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key
ADMIN_PRIVILEGED_EMAILS=your-email@example.com
```

### Step 3: Configure OAuth Redirect (for Google login)
1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3001/auth/callback
   ```
3. For production, also add:
   ```
   https://your-domain.com/auth/callback
   ```

### Step 4: Verify Configuration
```bash
cd admin
node scripts/check-auth-config.js
```

You should see: ✅ Configuration looks good!

### Step 5: Start the Server
```bash
npm install  # if not already done
npm run dev
```

Visit: http://localhost:3001/login

### Step 6: Create Your First Admin User

#### Option A: Use Privileged Email (Easiest)
Your email in `ADMIN_PRIVILEGED_EMAILS` automatically has admin access. Just sign up/login!

#### Option B: Set Admin Role in Database
1. Sign up a user through the login page
2. In Supabase Dashboard → **Table Editor** → **profiles**
3. Find your user and set:
   - `role` = `super_admin`
   - `status` = `active`

## ✅ You're Done!

Try logging in at http://localhost:3001/login

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Run the config check: `node scripts/check-auth-config.js`
- Make sure you restarted the dev server after editing `.env.local`

### "You do not have admin privileges"
- Add your email to `ADMIN_PRIVILEGED_EMAILS` in `.env.local`
- OR set your role to `super_admin` in the profiles table
- Restart the dev server

### Google login doesn't work
- Check OAuth redirect URL is configured in Supabase
- Enable Google provider in Supabase Dashboard → Authentication → Providers
- Allow popups in your browser

### Still having issues?
See the full guide: [AUTH_SETUP.md](./AUTH_SETUP.md)

## 📚 Additional Resources

- **Full Setup Guide**: [AUTH_SETUP.md](./AUTH_SETUP.md)
- **What Was Fixed**: [AUTH_FIXES_SUMMARY.md](./AUTH_FIXES_SUMMARY.md)
- **Supabase Docs**: https://supabase.com/docs/guides/auth
