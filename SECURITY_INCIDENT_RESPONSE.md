# 🚨 SECURITY INCIDENT RESPONSE - EXPOSED API KEYS

## CRITICAL: Your API keys are exposed in Git history

The following files contain sensitive credentials and have been committed to git:
- `.env` - Contains Supabase and Google Gemini keys
- `.env.production` - Contains Vercel OIDC token

---

## IMMEDIATE ACTIONS REQUIRED (Do these NOW):

### Step 1: Stop using exposed keys immediately

**A) Rotate Supabase Keys:**
1. Go to https://supabase.com/dashboard/project/xyqphrlfukufuuqbzgfb/settings/api
2. Click "Reset" on the `anon` key
3. Copy the new anon key
4. Update your local `.env` file with the new key
5. Update Vercel environment variables with new key

**B) Rotate Google Gemini API Key:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Find key: `AIzaSyDbp8bCMfACZZZoJvmqnk6RMWtbvtlPX9s`
3. Delete the old key
4. Create a new API key
5. Update your local `.env` file with the new key
6. Update Vercel environment variables with new key

**C) Rotate Vercel OIDC Token:**
1. Go to Vercel project settings
2. Regenerate OIDC token
3. Update `.env.production` with new token (keep this file local only!)

---

### Step 2: Remove sensitive files from Git tracking

Run these commands in your terminal:

```bash
# Remove .env files from git tracking (keeps files locally)
git rm --cached .env
git rm --cached .env.production

# Commit the removal
git commit -m "Remove sensitive environment files from git tracking"

# Push to remote
git push origin main
```

---

### Step 3: Clean Git History (ADVANCED - Be Careful!)

⚠️ **WARNING**: This rewrites git history and can break things. Only do this if:
- You've backed up your repository
- You've informed all collaborators
- You understand the risks

```bash
# Option A: Using BFG Repo-Cleaner (Recommended)
# 1. Install BFG: brew install bfg (Mac) or download from https://rtyley.github.io/bfg-repo-cleaner/
# 2. Clone a fresh bare repository
git clone --mirror https://github.com/YOUR_USERNAME/enso.git enso-cleanup.git
cd enso-cleanup.git

# 3. Run BFG to remove .env files from history
bfg --delete-files .env
bfg --delete-files .env.production

# 4. Clean up and push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Option B: Using git filter-branch (Built-in but slower)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Force push the cleaned history
git push origin --force --all
git push origin --force --tags
```

---

### Step 4: Set up environment variables properly

**For Local Development:**
1. Keep `.env` file locally (never commit!)
2. Create `.env.example` with dummy values for documentation

**For Vercel Deployment:**
1. Go to Vercel project settings → Environment Variables
2. Add all keys there (they're encrypted and secure)
3. Never put real keys in git

---

## Step 5: Create .env.example for documentation

Create a `.env.example` file (safe to commit) with dummy values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Google Drive OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-google-api-key-here
VITE_GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
```

---

## Step 6: Monitor for abuse

After rotating keys, monitor:
- Supabase dashboard for unusual activity
- Google Cloud Console for API usage spikes
- Vercel deployment logs

If you see suspicious activity, contact support immediately:
- Supabase: support@supabase.io
- Google Cloud: https://cloud.google.com/support
- Vercel: https://vercel.com/support

---

## Prevention for Future

✅ .gitignore now updated to exclude all .env files
✅ Use Vercel environment variables for production
✅ Use .env.example for documentation
✅ Enable pre-commit hooks to scan for secrets
✅ Regular security audits

---

## Questions?

If you need help with any of these steps, ask immediately. Security incidents require fast action.
