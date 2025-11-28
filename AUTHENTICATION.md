# Enso Authentication System

## Overview

Enso now includes a comprehensive authentication system with multiple login methods, password recovery, and secure session management. The system works seamlessly in both development (localStorage) and production (Supabase) modes.

## 🔐 Authentication Methods

### 1. Email & Password
- **Signup**: Create account with name, email, and password (minimum 6 characters)
- **Login**: Sign in with email and password
- **Security**: Passwords hashed and stored securely in Supabase
- **Development**: Basic password validation in localStorage mode

### 2. Google OAuth
- **One-click login** with Google account
- **Automatic profile creation** with Google profile data
- **Only available in production** (Supabase mode)
- **Seamless onboarding** for new users

### 3. GitHub OAuth
- **Developer-friendly** authentication via GitHub
- **Access to GitHub profile** information
- **Only available in production** (Supabase mode)
- **Perfect for technical teams**

### 4. Magic Links (Supabase only)
- **Passwordless authentication** via email
- **Enhanced security** with time-limited tokens
- **Fallback option** when password login fails
- **Better UX** for returning users

## 🔄 User Flows

### New User Registration

**Email/Password Flow:**
```
1. User fills signup form (name, email, password)
2. Account created in database
3. Email verification sent (Supabase) or instant login (localStorage)
4. Default team created automatically
5. User assigned as team owner
6. Redirected to dashboard
```

**OAuth Flow:**
```
1. User clicks "Continue with Google/GitHub"
2. Redirected to OAuth provider
3. User authorizes Enso app
4. Redirected back to Enso (/auth/callback)
5. Profile setup screen if new user
6. Team created automatically
7. Redirected to dashboard
```

### Returning User Login

**Email/Password:**
```
1. User enters credentials
2. Credentials verified
3. Session established
4. Team data loaded
5. Redirected to dashboard
```

**OAuth:**
```
1. User clicks OAuth button
2. Redirected to provider
3. Auto-login if already authorized
4. Redirected to dashboard
```

### Password Recovery

```
1. User clicks "Forgot password?" on login
2. Enters email address
3. Reset email sent with secure token
4. User clicks link in email
5. Redirected to reset password page (/auth/reset-password)
6. Enters new password
7. Password updated in database
8. Redirected to login with success message
```

## 🛡️ Security Features

### Database Security (Supabase)
- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - users only see their team's data
- **Secure token management** with automatic refresh
- **Email verification** for new accounts
- **Password encryption** with bcrypt

### Session Management
- **Automatic token refresh** prevents expired sessions
- **Secure logout** clears all session data
- **Cross-device sync** maintains sessions across browsers
- **Session timeout** for enhanced security

### Development Mode (localStorage)
- **Basic validation** for password length
- **No real encryption** (development only)
- **Simulated network delays** for realistic testing
- **Clear separation** from production data

## 🔧 Configuration

### Environment Variables
```bash
# Storage Mode
VITE_USE_SUPABASE=false  # Development mode
VITE_USE_SUPABASE=true   # Production mode

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Integration
VITE_GEMINI_API_KEY=your-gemini-key
```

### OAuth Provider Setup

**Google OAuth:**
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Configure in Supabase Authentication > Providers

**GitHub OAuth:**
1. Go to GitHub Settings > Developer settings
2. Create new OAuth App
3. Set callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Configure in Supabase Authentication > Providers

## 🎨 UI/UX Features

### Login Screen
- **Clean, minimalist design** following Enso aesthetic
- **Visual feedback** for loading states and errors
- **Mode switching** between login, signup, and password reset
- **OAuth buttons** with provider branding
- **Password visibility toggle** for better UX
- **Environment indicator** shows development vs production

### Auth Callback Page
- **Loading spinner** during OAuth processing
- **Profile setup** for new OAuth users
- **Error handling** with helpful messages
- **Automatic redirect** to dashboard on success

### Password Reset Page
- **Secure password update** form
- **Password confirmation** field
- **Strength validation** (minimum 6 characters)
- **Success confirmation** with auto-redirect

## 📱 Responsive Design

- **Mobile-optimized** forms and buttons
- **Touch-friendly** interaction elements
- **Accessible** labels and ARIA attributes
- **Dark mode support** across all auth screens

## 🚀 Production Deployment

### Required Steps:
1. **Database setup** - Run the SQL schema in Supabase
2. **Environment variables** - Configure all required variables
3. **OAuth providers** - Set up Google/GitHub apps (optional)
4. **Email configuration** - Customize email templates
5. **Domain setup** - Configure redirect URLs
6. **SSL certificate** - Ensure HTTPS for OAuth callbacks

### Testing Checklist:
- [ ] Email/password signup and login
- [ ] Google OAuth flow (if configured)
- [ ] GitHub OAuth flow (if configured)
- [ ] Password reset email delivery
- [ ] Password reset functionality
- [ ] Team creation for new users
- [ ] Session persistence across browser restarts
- [ ] Logout functionality
- [ ] Error handling for invalid credentials

## 🔍 Debugging

### Common Issues:
1. **OAuth redirect errors** - Check callback URLs match exactly
2. **Email not sending** - Verify Supabase email configuration
3. **Session not persisting** - Check HTTPS and cookie settings
4. **RLS blocking queries** - Review database policies
5. **Environment variables** - Ensure they start with `VITE_`

### Debug Mode:
- Check browser console for error messages
- Verify network requests in DevTools
- Test with different browsers and incognito mode
- Use Supabase dashboard to monitor auth events

## 🎯 Future Enhancements

### Planned Features:
- **Multi-factor authentication (2FA)** for enhanced security
- **Social providers** (Apple, Microsoft, LinkedIn)
- **Profile management** page with password change
- **Account deletion** with data export
- **Session management** with device list
- **Advanced role management** with custom permissions

### Technical Improvements:
- **Rate limiting** for login attempts
- **Audit logging** for security events
- **Advanced password policies** with complexity requirements
- **SSO integration** for enterprise customers
- **Backup authentication codes** for 2FA recovery

---

The Enso authentication system provides enterprise-grade security with a minimalist, user-friendly interface that perfectly matches the application's design philosophy.