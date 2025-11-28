# Subdirectory Deployment Guide

This guide covers deploying Enso to `https://poetics.studio/experiments/enso/`

## 🔧 **Google OAuth Configuration**

### **Correct Setup:**

**Google Cloud Console:**
```
Authorized JavaScript origins:
https://poetics.studio
https://abcdefghijklmnop.supabase.co

Authorized redirect URIs:
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

### **⚠️ Important Notes:**
- **DO NOT** include `/experiments/enso` in the redirect URI
- The redirect URI should ONLY be your Supabase URL + `/auth/v1/callback`
- JavaScript origins should include both your domain AND Supabase URL

## 🔄 **OAuth Flow for Subdirectory**

1. User visits: `https://poetics.studio/experiments/enso`
2. Clicks "Continue with Google"
3. Redirected to: `accounts.google.com` (OAuth)
4. User authorizes app
5. Google redirects to: `https://your-project.supabase.co/auth/v1/callback`
6. Supabase processes auth
7. Supabase redirects to: `https://poetics.studio/experiments/enso/auth/callback`
8. Your app handles final auth state

## 🏗️ **Build Configuration**

The project is already configured for subdirectory deployment:

**Vite Config (`vite.config.ts`):**
```typescript
base: mode === 'production' ? '/experiments/enso/' : '/'
```

**Vercel Config (`vercel.json`):**
```json
{
  "rewrites": [
    { "source": "/experiments/enso/(.*)", "destination": "/index.html" }
  ]
}
```

## 📁 **File Structure After Build**

```
dist/
├── index.html (references assets with /experiments/enso/ prefix)
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
```

## 🚀 **Deployment Steps**

### **1. Environment Variables (Vercel)**
```bash
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### **2. Domain Configuration**
- Ensure your app will be accessible at `https://poetics.studio/experiments/enso/`
- Configure Vercel to serve the built files at this path

### **3. Supabase Site URL**
In Supabase → Authentication → Settings:
```
Site URL: https://poetics.studio/experiments/enso
```

## 🧪 **Testing Checklist**

After deployment, test:

- [ ] **Direct access**: `https://poetics.studio/experiments/enso/` loads correctly
- [ ] **Routing**: All internal navigation works (dashboard, projects, etc.)
- [ ] **Assets loading**: CSS and JS files load with correct paths
- [ ] **OAuth flows**:
  - [ ] Google login redirects correctly
  - [ ] GitHub login redirects correctly
  - [ ] OAuth callback handling works
  - [ ] Password reset emails link correctly
- [ ] **Authentication persistence**: Refresh page keeps you logged in
- [ ] **Team functionality**: Create, edit, invite members
- [ ] **Project management**: Create, edit, delete projects

## 🚨 **Common Issues**

### **Assets not loading (404 errors)**
- Check that Vite base path is set correctly
- Verify Vercel routing configuration

### **OAuth redirect errors**
- Ensure Google/GitHub OAuth URIs are EXACTLY: `https://your-project.supabase.co/auth/v1/callback`
- Check Supabase Site URL is set to your subdirectory

### **Routing breaks on refresh**
- Verify Vercel rewrites are configured properly
- Check that all routes fall under `/experiments/enso/`

### **Authentication loops**
- Check that all redirect URLs use the full subdirectory path
- Verify environment variables are set correctly

## 📝 **File Changes Made**

All code has been updated to handle the subdirectory path:

✅ **OAuth redirects** → `/experiments/enso/auth/callback`
✅ **Password reset** → `/experiments/enso/auth/reset-password`
✅ **Navigation redirects** → `/experiments/enso/`
✅ **Build configuration** → Assets served from subdirectory
✅ **Vercel routing** → Properly handles SPA routing

Your app is now fully configured for subdirectory deployment! 🎉