# Vercel Free Tier Deployment Guide

## ✅ **Fixed Configuration Issues**

The repository has been updated to work perfectly with Vercel's free tier:

- ✅ **No custom domain required** - Deploy to `*.vercel.app`
- ✅ **Root path deployment** - No subdirectory complications
- ✅ **Proper OAuth redirects** - All auth flows working
- ✅ **Free tier compatible** - No premium features needed

## 🚀 **Step-by-Step Vercel Deployment**

### **1. Import Project to Vercel**

1. **Go to**: https://vercel.com/dashboard
2. **Click**: "Add New..." → "Project"
3. **Import Git Repository**: Select `Studio-Poetics/enso`
4. **Framework Detection**: Should auto-detect as **"Vite"**

### **2. Configure Build Settings**

**If deploy button is disabled, click "Configure Project":**

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Root Directory: (leave empty)
Node.js Version: 18.x or 20.x
```

### **3. Add Environment Variables (REQUIRED)**

**Before deploying, add these environment variables:**

```bash
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**How to add them:**
1. In Vercel dashboard → "Environment Variables" tab
2. Add each variable with name and value
3. Set Environment: **"Production", "Preview", and "Development"**

### **4. Deploy**

1. **Click "Deploy"**
2. **Wait for build** (usually 1-2 minutes)
3. **Get your URL**: `https://enso-studio-poetics.vercel.app` (or similar)

## 🎯 **Your App Will Be Live At**

Vercel will give you a URL like:
- `https://enso.vercel.app`
- `https://enso-studio-poetics.vercel.app`
- `https://enso-git-main-studio-poetics.vercel.app`

**All features will work:**
- ✅ **Authentication** (email/password + OAuth)
- ✅ **Team management**
- ✅ **Project creation**
- ✅ **AI integration** (with Gemini API key)

## 🔐 **OAuth Configuration for Vercel Domain**

### **Google OAuth Setup:**

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
https://your-project.supabase.co
```

**Authorized redirect URIs:**
```
https://your-project.supabase.co/auth/v1/callback
```

### **GitHub OAuth Setup:**

**Homepage URL:**
```
https://your-app.vercel.app
```

**Authorization callback URL:**
```
https://your-project.supabase.co/auth/v1/callback
```

### **Supabase Site URL:**
In Supabase → Authentication → Settings:
```
Site URL: https://your-app.vercel.app
```

## 🛠️ **Troubleshooting**

### **Deploy Button Disabled?**
1. **Click "Configure Project"**
2. **Manually set Framework to "Vite"**
3. **Set Build Command to `npm run build`**
4. **Set Output Directory to `dist`**

### **Build Failing?**
- **Check environment variables** are added
- **Verify Node.js version** is 18.x or 20.x
- **Check build logs** for specific errors

### **OAuth Not Working?**
1. **Update Google/GitHub OAuth** with new Vercel domain
2. **Update Supabase Site URL** to your Vercel domain
3. **Check environment variables** are set correctly

### **App Not Loading?**
1. **Check Console** for errors
2. **Verify environment variables** are set for Production
3. **Ensure VITE_USE_SUPABASE=true** for production

## 📋 **Environment Variables Checklist**

Make sure ALL of these are set in Vercel:

- [ ] `VITE_USE_SUPABASE` = `true`
- [ ] `VITE_SUPABASE_URL` = Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
- [ ] `VITE_GEMINI_API_KEY` = Your Google Gemini API key

## 🎉 **After Successful Deployment**

### **Test These Features:**
1. **App loads** at your Vercel URL
2. **Create account** with email/password
3. **Login works**
4. **OAuth login** (if configured)
5. **Password reset**
6. **Create team**
7. **Create project**
8. **AI assistance** works

### **Next Steps:**
1. **Share your app** with the Vercel URL
2. **Set up custom domain** later (if needed)
3. **Monitor usage** in Vercel dashboard
4. **Scale up** if you hit free tier limits

## 💰 **Vercel Free Tier Limits**

- ✅ **100GB bandwidth** per month
- ✅ **100 build hours** per month
- ✅ **Unlimited static sites**
- ✅ **Custom domains** (1 per project on free tier)
- ✅ **SSL certificates** included
- ✅ **Global CDN**

Perfect for your Enso project! 🚀

---

**Your app is now ready to deploy to Vercel free tier with zero complications!** 🎯