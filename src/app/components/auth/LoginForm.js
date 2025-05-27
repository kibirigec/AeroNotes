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
    <div>
      <h3>Login with PIN..</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="lastFour">Last 4 Digits of Phone:</label>
          <input
            id="lastFour"
            type="text"
            value={lastFourDigits}
            onChange={(e) => setLastFourDigits(e.target.value)}
            maxLength="4"
            pattern="[0-9]{4}"
            title="Enter the last 4 digits of your phone number"
            required
          />
        </div>
        <div>
          <label htmlFor="pin">PIN:</label>
          <input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            minLength="4"
            maxLength="8"
            pattern="[0-9]{4,8}"
            title="PIN must be 4 to 8 digits"
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
      </form>
    </div>
  );
} 