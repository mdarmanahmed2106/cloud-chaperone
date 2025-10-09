# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with GitHub, Google, or email
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `cloud-chaperone` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
6. Click "Create new project"

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Update Environment Variables

Replace the values in `cloud-chaperone/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

## Step 4: Run Database Migration

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push the migration:
   ```bash
   supabase db push
   ```

## Step 5: Test the Application

1. Save your `.env.local` file
2. The dev server will auto-reload
3. Go to your app and try signing up
4. Check Supabase dashboard → Authentication → Users to see new users

## Step 6: Configure Authentication (Optional)

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:8080` (for development)
   - **Redirect URLs**: Add your production domain when ready
   - **Email templates**: Customize if needed

## Step 7: Storage Setup

The migration already creates a `user-files` storage bucket with proper policies. Files will be stored in user-specific folders.

## Deployment Ready!

Once configured, your app will be fully functional and ready for deployment to:
- Vercel
- Netlify  
- Railway
- Any platform that supports Vite/React

Just remember to add your environment variables to your deployment platform.
