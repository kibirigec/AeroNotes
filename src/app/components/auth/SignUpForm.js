"use client";

import { useState } from 'react';
import supabase from '../../../../lib/supabase'; // Main Supabase client

export default function SignUpForm() {
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP and PIN
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setMessage(data.message || 'OTP sent successfully!');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/verify-otp-and-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp, pin }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed');
      }
      
      setMessage(data.message || 'Sign up successful!');
      // The AuthProvider will automatically pick up the session from signInWithPassword if successful
      // Reset form or redirect user as needed
      setPhoneNumber('');
      setOtp('');
      setPin('');
      setStep(1); // Or redirect to a protected page
       // If the API returns a session, we might need to manually update the client session
      if (data.session) {
        // This manually sets the session on the client if the API returns it.
        // The onAuthStateChange listener in AuthProvider should also pick this up.
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        if (sessionError) {
            console.error("Error setting session on client:", sessionError);
            setError("Signup successful, but failed to update client session. Please try logging in.");
        } else {
            setMessage("Signup successful and session updated on client!");
            // Potentially trigger a navigation or UI update here
        }
      } else if (data.userId) {
        // Handle case where signup was ok but auto sign in failed
        setMessage(data.message || "Signup successful. Please log in.");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3>Sign Up</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div>
            <label htmlFor="phoneNumber">Phone Number:</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+12345678900"
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtpAndSignUp}>
          <div>
            <label htmlFor="otp">OTP:</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="pin">Choose PIN (4-8 digits):</label>
            <input
              id="pin"
              type="text" // Keeping as text for now for visibility during debugging
              value={pin}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, ''); // Allow only digits
                setPin(numericValue);
              }}
              minLength="4"
              maxLength="8"
              pattern="^\d{4,8}$" // Anchored pattern: 4 to 8 digits exactly
              title="PIN must be 4 to 8 digits"
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      )}
    </div>
  );
} 