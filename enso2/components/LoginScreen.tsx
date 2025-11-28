import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required");
        await signup(name, email);
      } else {
        await login(email);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-sumi flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full border border-gray-200 dark:border-neutral-800 opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border border-vermilion opacity-5" />

      <div className="max-w-md w-full space-y-12 z-10">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-serif text-sumi dark:text-paper">Enso</h1>
          <p className="text-sm font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">The Minimalist Studio</p>
        </div>

        <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8 border border-gray-200 dark:border-neutral-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">Name</label>
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
              <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 font-serif text-lg text-sumi dark:text-paper focus:border-sumi dark:focus:border-paper focus:outline-none transition-colors"
                placeholder="design@poetics.studio"
              />
            </div>

            {error && (
              <p className="text-xs text-vermilion bg-red-50 dark:bg-red-900/20 p-2">{error}</p>
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
                  <span className="uppercase tracking-widest text-sm font-medium">{isSignUp ? 'Enter Studio' : 'Return to Work'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper border-b border-transparent hover:border-sumi dark:hover:border-paper transition-all pb-1 font-medium"
            >
              {isSignUp ? "Already have a key? Sign In" : "New to Enso? Create Account"}
            </button>
          </div>
        </div>

        <div className="text-center space-y-2">
           <p className="font-serif italic text-gray-500 dark:text-gray-600 text-sm">"Less, but better."</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;