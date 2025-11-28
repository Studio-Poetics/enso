# Enso Deployment Guide

This guide will help you deploy Enso to production using **Vercel** (hosting) and **Supabase** (database).

## Quick Setup (5 minutes)

### 1. 🗄️ Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project (free tier: 500MB database)
   - Note your `Project URL` and `anon public key`

2. **Setup Database Schema**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `database/schema.sql`
   - Run the script to create tables and policies

3. **Configure Authentication**
   - Go to Authentication > Settings in Supabase
   - Enable "Allow new users to sign up"
   - Configure email templates for better UX
   - Set up OAuth providers (optional but recommended):

   **Google OAuth Setup:**
   - Go to Authentication > Providers in Supabase
   - Enable Google provider
   - Add your Google OAuth credentials (see OAuth setup section below)

   **GitHub OAuth Setup:**
   - Go to Authentication > Providers in Supabase
   - Enable GitHub provider
   - Add your GitHub OAuth App credentials (see OAuth setup section below)

### 2. 🚀 Hosting Setup (Vercel)

1. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables**
   In Vercel dashboard → Project Settings → Environment Variables:
   ```
   VITE_USE_SUPABASE=true
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Redeploy**
   - Trigger a new deployment after adding environment variables

## Alternative: GitHub Integration

### Auto-Deploy Setup

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/enso.git
   git push -u origin main
   ```

2. **Connect Vercel to GitHub**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Add environment variables as shown above
   - Deploy!

## Development vs Production

### Local Development (localStorage)
```bash
# .env.local
VITE_USE_SUPABASE=false
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Production (Supabase)
```bash
# Vercel Environment Variables
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Features Enabled

✅ **Multi-Auth System** - Email/password, Google OAuth, GitHub OAuth, magic links
✅ **Password Recovery** - Secure password reset via email
✅ **Teams & Collaboration** - Multi-user workspaces with role-based access
✅ **Project Management** - Create, edit, share projects
✅ **Real-time Sync** - Changes sync across devices
✅ **Secure** - Row-level security (users only see their team's data)
✅ **Scalable** - Free tier supports small teams, paid plans for growth

## Costs

- **Supabase Free**: 500MB database, 2 concurrent connections
- **Vercel Free**: 100GB bandwidth/month, custom domain
- **Total**: $0/month for small teams

## OAuth Provider Setup

### Google OAuth (Optional)

1. **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application

   **Authorized JavaScript origins:**
   ```
   https://poetics.studio
   https://your-project.supabase.co
   ```

   **Authorized redirect URIs:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

2. **Configure in Supabase:**
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Client ID and Client Secret

### GitHub OAuth (Optional)

1. **Create GitHub OAuth App:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - **Homepage URL:** `https://poetics.studio/experiments/enso`
   - **Authorization callback URL:** `https://your-project.supabase.co/auth/v1/callback`

2. **Configure in Supabase:**
   - Go to Authentication > Providers
   - Enable GitHub provider
   - Add your Client ID and Client Secret

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Redeploy after adding variables
   - Check browser dev tools for error messages

2. **Database Connection Errors**
   - Verify Supabase URL and key are correct
   - Check if RLS policies are properly set up
   - Ensure database schema was applied correctly

3. **Authentication Issues**
   - Check Supabase auth settings
   - Verify email provider configuration
   - Test with localhost first

### Support

For issues specific to:
- **Hosting**: [Vercel Documentation](https://vercel.com/docs)
- **Database**: [Supabase Documentation](https://supabase.com/docs)
- **Enso**: Check the console for error messages

## Security Notes

- Never commit `.env` files to git
- Use different Supabase projects for development/production
- Regularly rotate API keys
- Monitor usage through Supabase dashboard

---

**Ready to deploy?** Follow the Quick Setup above! 🚀