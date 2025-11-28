import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { isUsingSupabase } from '../services';

type AuthMode = 'login' | 'signup' | 'forgot';

const LoginScreen: React.FC = () => {
  const { login, loginWithOAuth, signup, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error("Name is required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        await signup(name, email, password);
      } else if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'forgot') {
        await resetPassword(email);
      }
    } catch (err: any) {
      if (err.message === 'CHECK_EMAIL') {
        setSuccess('Check your email for further instructions');
      } else if (err.message === 'CONFIRM_EMAIL') {
        setSuccess('Please check your email to confirm your account');
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-sumi flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden transition-colors duration-300">

      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full border border-gray-200 dark:border-neutral-800 opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border border-vermilion opacity-5" />

      <div className="max-w-md w-full space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-serif text-sumi dark:text-paper">Enso</h1>
          <p className="text-sm font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">The Minimalist Studio</p>
        </div>

        {/* Auth Container */}
        <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8 border border-gray-200 dark:border-neutral-800 shadow-xl">

          {/* OAuth Buttons (only in production/Supabase mode) */}
          {isUsingSupabase && mode !== 'forgot' && (
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 py-3 px-4 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
              </button>

              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 dark:bg-gray-700 text-white py-3 px-4 hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 shadow-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm font-medium">Continue with GitHub</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400">or continue with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                  placeholder="Kenya Hara"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-2.5 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-7 bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                  placeholder="design@poetics.studio"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-0 top-2.5 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-7 pr-7 bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                    placeholder={mode === 'signup' ? "Minimum 6 characters" : "Enter your password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-2.5 text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-vermilion bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sumi dark:bg-paper text-white dark:text-sumi py-4 flex items-center justify-center gap-2 hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors duration-500 disabled:opacity-50 shadow-lg"
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-sm font-medium">
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switching */}
          <div className="mt-8 text-center space-y-3">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => switchMode('signup')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper border-b border-transparent hover:border-sumi dark:hover:border-paper transition-all pb-1 font-medium"
                >
                  New to Enso? Create Account
                </button>
                <br />
                <button
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper border-b border-transparent hover:border-sumi dark:hover:border-paper transition-all pb-1 font-medium"
                >
                  Forgot your password?
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button
                onClick={() => switchMode('login')}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper border-b border-transparent hover:border-sumi dark:hover:border-paper transition-all pb-1 font-medium"
              >
                Already have an account? Sign In
              </button>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => switchMode('login')}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper border-b border-transparent hover:border-sumi dark:hover:border-paper transition-all pb-1 font-medium"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="text-center space-y-2">
          <p className="font-serif italic text-gray-500 dark:text-gray-600 text-sm">"Less, but better."</p>
          {!isUsingSupabase && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Development Mode • OAuth available in production
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;