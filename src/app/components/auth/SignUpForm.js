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

  // Convert Uganda phone number format to international format
  const formatPhoneNumber = (phone) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with +256
    if (cleaned.startsWith('0')) {
      return '+256' + cleaned.substring(1);
    }
    
    // If it starts with 256, add +
    if (cleaned.startsWith('256')) {
      return '+' + cleaned;
    }
    
    // If it starts with +256, return as is
    if (phone.startsWith('+256')) {
      return phone;
    }
    
    // If it's 9 digits and doesn't start with 0, assume it's missing the leading 7/0
    if (cleaned.length === 9) {
      return '+256' + cleaned;
    }
    
    // Default: assume it needs +256 prefix
    return '+256' + cleaned;
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    // Limit to 10 digits
    if (numericValue.length <= 10) {
      setPhoneNumber(numericValue);
    }
  };

  const handleFocus = (event) => {
    // Override autocomplete attribute when focused
    if (event.target.autocomplete) {
      event.target.autocomplete = "nope-" + Math.random();
    }
    // Also set the attribute directly
    event.target.setAttribute('autocomplete', 'nope-' + Math.random());
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      // Format the phone number before sending
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setMessage(data.message || 'OTP sent successfully!');
      // Update the phone number state with the formatted version
      setPhoneNumber(formattedPhone);
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
              inputMode="numeric"
              pattern="[0-9]*"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              onFocus={handleFocus}
              placeholder="0772345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your Uganda mobile number (e.g., 0772345678)
            </p>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl font-semibold text-sm shadow transition border bg-blue-200 dark:bg-[#1a2655] border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-[#1e2a5a] hover:border-blue-500 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onFocus={handleFocus}
                placeholder="123456"
                maxLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400 text-center text-lg tracking-widest"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                required
              />
            </div>
            
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Create a PIN (4 digits)
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, ''); // Allow only digits
                  // Limit to exactly 4 digits
                  if (numericValue.length <= 4) {
                    setPin(numericValue);
                  }
                }}
                onFocus={handleFocus}
                minLength="4"
                maxLength="4"
                pattern="^\d{4}$"
                title="PIN must be exactly 4 digits"
                placeholder="Enter your 4-digit PIN"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                role="textbox"
                aria-label="Create 4-digit PIN"
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
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm shadow transition border bg-blue-100 dark:bg-[#152047] border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm shadow transition border bg-blue-200 dark:bg-[#1a2655] border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-[#1e2a5a] hover:border-blue-500 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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