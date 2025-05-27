"use client";

import { useState } from 'react';
import supabase from '../../../../lib/supabase'; // Main Supabase client

export default function LoginForm() {
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/login-with-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastFourDigits, pin }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // If the API returns a session, we need to manually update the client session
      if (data.session) {
        // This manually sets the session on the client if the API returns it.
        // The onAuthStateChange listener in AuthProvider should also pick this up.
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        if (sessionError) {
            console.error("Error setting session on client:", sessionError);
            setError("Login successful, but failed to update client session.");
        } else {
            setMessage("Login successful and session updated on client!");
            // Potentially trigger a navigation or UI update here
             // e.g. router.push('/dashboard') or similar
        }
      } else {
        // Should not happen if login API is correct
        setError("Login successful, but no session data received.");
      }
      // Reset form or redirect
      setLastFourDigits('');
      setPin('');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error and Success Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">{message}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="lastFour" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last 4 Digits of Phone
          </label>
          <input
            id="lastFour"
            type="text"
            value={lastFourDigits}
            onChange={(e) => setLastFourDigits(e.target.value)}
            maxLength="4"
            pattern="[0-9]{4}"
            title="Enter the last 4 digits of your phone number"
            placeholder="1234"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
            required
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN
          </label>
          <input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            minLength="4"
            maxLength="8"
            pattern="[0-9]{4,8}"
            title="PIN must be 4 to 8 digits"
            placeholder="Enter your PIN"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
} 