# Google Drive Integration Setup

Enso uses Google Drive API to store large media files (>500KB) to avoid localStorage size limitations. This setup is optional - the app will work with base64 storage for smaller files even without Google Drive configuration.

## Prerequisites

1. Google Cloud Console account
2. A Google Cloud project

## Setup Steps

### 1. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Drive API"
5. Click **Enable**

### 2. Create API Credentials

#### Get API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy the API key
4. (Recommended) Click **RESTRICT KEY** and:
   - Set **Application restrictions** to **HTTP referrers**
   - Add your domain (e.g., `https://yourdomain.com/*`)
   - Under **API restrictions**, select **Google Drive API**

#### Create OAuth 2.0 Client ID

1. In **Credentials**, click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill required fields (App name, User support email, Developer contact)
   - Add scopes: `https://www.googleapis.com/auth/drive.file`
3. Choose **Web application** as application type
4. Set **Authorized JavaScript origins**:
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
5. Leave **Authorized redirect URIs** empty (not needed for this flow)
6. Copy the **Client ID**

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example
VITE_GOOGLE_API_KEY=your-api-key-here
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### 4. Deploy Configuration

For Vercel deployment, add these environment variables in your Vercel dashboard:
- Go to your project dashboard
- Navigate to **Settings** → **Environment Variables**
- Add `VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_CLIENT_ID`

## How It Works

- Files smaller than 500KB are stored as base64 in localStorage/Supabase
- Files larger than 500KB are uploaded to Google Drive
- The app automatically handles Google Drive authentication when needed
- Files are stored in the app's private folder (`appDataFolder`)
- Public sharing links are generated for display in the app

## Troubleshooting

### "Origin not allowed" Error
- Check that your domain is added to **Authorized JavaScript origins**
- Ensure the URL format is correct (no trailing slashes)

### "Quota Exceeded" Error
- Google Drive API has usage quotas
- For high-usage applications, consider requesting quota increases

### Authentication Popup Blocked
- Ensure popup blockers allow the authentication popup
- Some users may need to manually allow popups for your domain

## Security Notes

- API keys and Client IDs are safe to expose in client-side code
- Files are stored in the app's private folder, not the user's main Drive
- The app only requests `drive.file` scope (access to files created by the app)