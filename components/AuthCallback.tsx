import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const { signupWithOAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'needs_setup'>('loading');
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session?.user) {
          const user = data.session.user;

          // Check if user already has a team (returning user)
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .limit(1);

          if (teamMembers && teamMembers.length > 0) {
            // Existing user, redirect to app
            setStatus('success');
            setTimeout(() => {
              window.location.href = '/experiments/enso/';
            }, 2000);
          } else {
            // New user, needs team setup
            setName(user.user_metadata?.name || user.email?.split('@')[0] || '');
            setStatus('needs_setup');
          }
        } else {
          setStatus('error');
          setError('No authentication session found');
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Authentication failed');
      }
    };

    handleAuthCallback();
  }, []);

  const handleSetupComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStatus('loading');
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await signupWithOAuth(name, data.user.email || '');
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/experiments/enso/';
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Setup failed');
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-sumi flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-sumi dark:text-paper mb-2">Enso</h1>
          <p className="text-sm font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">Authentication</p>
        </div>

        <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8 border border-gray-200 dark:border-neutral-800 shadow-xl">

          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader className="animate-spin mx-auto text-sumi dark:text-paper" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Setting up your account...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto text-green-600" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Welcome to Enso! Redirecting...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="mx-auto text-vermilion" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Authentication failed</p>
              <p className="text-xs text-vermilion">{error}</p>
              <button
                onClick={() => window.location.href = '/experiments/enso/'}
                className="mt-4 text-sm text-sumi dark:text-paper hover:text-vermilion transition-colors"
              >
                Return to login
              </button>
            </div>
          )}

          {status === 'needs_setup' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <CheckCircle className="mx-auto text-green-600" size={32} />
                <h3 className="text-lg font-serif text-sumi dark:text-paper">Welcome to Enso!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Let's complete your profile</p>
              </div>

              <form onSubmit={handleSetupComplete} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                    placeholder="Kenya Hara"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full bg-sumi dark:bg-paper text-white dark:text-sumi py-3 flex items-center justify-center gap-2 hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium">Complete Setup</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthCallback;