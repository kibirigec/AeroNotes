'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      if (isLogin) {
        // Handle login
        const { success, error } = await signIn(email, password);
        if (success) {
          router.push('/');
        } else {
          setErrorMessage(error.message || 'Failed to sign in');
        }
      } else {
        // Handle signup
        const { success, error } = await signUp(email, password);
        if (success) {
          setIsLogin(true);
          setErrorMessage('Check your email to confirm your account!');
        } else {
          setErrorMessage(error.message || 'Failed to sign up');
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 relative">
      <div className="w-full max-w-md bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-blue-900">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
          </div>
          <p className="mt-2 text-blue-600 dark:text-blue-300">Your personal cloud storage</p>
        </div>
        
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-6">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        
        {errorMessage && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-blue-900 dark:text-blue-50"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-blue-900 dark:text-blue-50"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-dark)] text-white font-medium py-3 px-4 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue-light)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage('');
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
        
        <div className="mt-8 border-t border-blue-100 dark:border-blue-900 pt-6 text-center text-sm text-blue-500 dark:text-blue-400">
          <Link href="/" className="hover:text-blue-700 dark:hover:text-blue-300">
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
} 