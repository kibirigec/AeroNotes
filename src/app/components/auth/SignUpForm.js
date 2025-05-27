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
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 1 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          1
        </div>
        <div className={`w-12 h-1 ${
          step >= 2 
            ? 'bg-blue-600' 
            : 'bg-gray-200 dark:bg-gray-700'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 2 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          2
        </div>
      </div>

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

      {/* Step 1: Phone Number */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Include country code (e.g., +1 for US)
            </p>
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
                Sending OTP...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </form>
      )}

      {/* Step 2: OTP and PIN */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We sent a verification code to <span className="font-medium">{phoneNumber}</span>
            </p>
          </div>
          
          <form onSubmit={handleVerifyOtpAndSignUp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400 text-center text-lg tracking-widest"
                required
              />
            </div>
            
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Create a PIN (4-8 digits)
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, ''); // Allow only digits
                  setPin(numericValue);
                }}
                minLength="4"
                maxLength="8"
                pattern="^\d{4,8}$"
                title="PIN must be 4 to 8 digits"
                placeholder="Enter your PIN"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This PIN will be used for future logins
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 