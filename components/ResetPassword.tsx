import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!data.session || error) {
        window.location.href = '/';
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-paper dark:bg-sumi flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-sumi dark:text-paper mb-2">Enso</h1>
          </div>

          <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8 border border-gray-200 dark:border-neutral-800 shadow-xl text-center space-y-4">
            <CheckCircle className="mx-auto text-green-600" size={48} />
            <h3 className="text-lg font-serif text-sumi dark:text-paper">Password Updated!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your password has been successfully updated. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-sumi flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-sumi dark:text-paper mb-2">Enso</h1>
          <p className="text-sm font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">Reset Password</p>
        </div>

        <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8 border border-gray-200 dark:border-neutral-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-2.5 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-7 pr-7 bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                  placeholder="Minimum 6 characters"
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

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-2.5 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-7 bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-vermilion bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full bg-sumi dark:bg-paper text-white dark:text-sumi py-4 flex items-center justify-center gap-2 hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors duration-500 disabled:opacity-50 shadow-lg"
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-sm font-medium">Update Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;