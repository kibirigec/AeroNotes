"use client";

import { useState, useRef, useEffect } from 'react';
import supabase from '../../../../lib/supabase';

export default function LoginForm({ onStepChange }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [phoneSuffix, setPhoneSuffix] = useState(['', '', '', '']);
  const [showPhoneSuffix, setShowPhoneSuffix] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedAutoSubmit, setHasAttemptedAutoSubmit] = useState(false);
  
  // Refs for input boxes
  const pinRefs = useRef([]);
  const phoneSuffixRefs = useRef([]);
  
  // Check if PIN is complete
  const isPinComplete = pin.every(digit => digit !== '');
  const isPhoneSuffixComplete = phoneSuffix.every(digit => digit !== '');

  // Show phone suffix boxes when PIN is complete
  useEffect(() => {
    if (isPinComplete && !showPhoneSuffix) {
      setTimeout(() => {
        setShowPhoneSuffix(true);
        onStepChange?.(2); // Notify parent we're on step 2
        // Focus first phone suffix box after animation
        setTimeout(() => {
          if (phoneSuffixRefs.current[0]) {
            phoneSuffixRefs.current[0].focus();
          }
        }, 300);
      }, 200);
    } else if (!isPinComplete && showPhoneSuffix) {
      setShowPhoneSuffix(false);
      onStepChange?.(1); // Notify parent we're back to step 1
    }
  }, [isPinComplete, showPhoneSuffix, onStepChange]);

  // Auto-submit when phone suffix is complete
  useEffect(() => {
    if (isPinComplete && isPhoneSuffixComplete && !isLoading && !hasAttemptedAutoSubmit) {
      // Small delay to let the user see their input
      setTimeout(() => {
        handleSubmit(new Event('submit'));
      }, 500);
      setHasAttemptedAutoSubmit(true);
    }
  }, [isPhoneSuffixComplete, isPinComplete, isLoading, hasAttemptedAutoSubmit]);

  const handlePinChange = (index, value) => {
    // Only allow single digits
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Reset auto-submit flag when user changes input
    setHasAttemptedAutoSubmit(false);

    // Auto-focus next box
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePhoneSuffixChange = (index, value) => {
    // Only allow single digits
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPhoneSuffix = [...phoneSuffix];
    newPhoneSuffix[index] = value;
    setPhoneSuffix(newPhoneSuffix);
    
    // Reset auto-submit flag when user changes input
    setHasAttemptedAutoSubmit(false);

    // Auto-focus next box
    if (value && index < 3) {
      phoneSuffixRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, type, index) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (type === 'pin') {
        if (!pin[index] && index > 0) {
          pinRefs.current[index - 1]?.focus();
        }
      } else {
        if (!phoneSuffix[index] && index > 0) {
          phoneSuffixRefs.current[index - 1]?.focus();
        }
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPinComplete || !isPhoneSuffixComplete) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/login-with-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lastFourDigits: phoneSuffix.join(''), 
          pin: pin.join('') 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      if (data.session) {
        // Instead of manually setting session, try a more robust approach
        try {
          // First approach: Set the session
          const { error: sessionError } = await supabase.auth.setSession(data.session);
          
          if (sessionError) {
            console.error("Primary session setting failed:", sessionError);
            
            // Fallback: Try direct authentication with credentials (mobile-friendly)
            if (data.credentials?.phone && data.credentials?.password) {
              console.log("Attempting fallback authentication with credentials...");
              try {
                const { data: fallbackAuth, error: fallbackError } = await supabase.auth.signInWithPassword({
                  phone: data.credentials.phone,
                  password: data.credentials.password,
                });
                
                if (fallbackError) {
                  console.error("Fallback authentication failed:", fallbackError);
                  setError("Login successful, but session update failed. Please try again or refresh the page.");
                } else if (fallbackAuth?.session) {
                  console.log("Fallback authentication successful!");
                  setMessage("Welcome back!");
                  // Reset form
                  setPin(['', '', '', '']);
                  setPhoneSuffix(['', '', '', '']);
                  setShowPhoneSuffix(false);
                  onStepChange?.(1);
                } else {
                  setError("Login successful, but failed to establish session. Please try again.");
                }
              } catch (fallbackException) {
                console.error("Fallback authentication exception:", fallbackException);
                setError("Login successful, but session update failed. Please refresh the page.");
              }
            } else {
              // Original retry logic as final fallback
              setTimeout(async () => {
                try {
                  const { data: refreshedSession, error: refreshError } = await supabase.auth.getSession();
                  if (refreshError) {
                    console.error("Session refresh failed:", refreshError);
                    setError("Login successful, but session update failed. Please refresh the page.");
                  } else if (refreshedSession?.session) {
                    setMessage("Welcome back!");
                    // Reset form
                    setPin(['', '', '', '']);
                    setPhoneSuffix(['', '', '', '']);
                    setShowPhoneSuffix(false);
                    onStepChange?.(1);
                  } else {
                    setError("Login successful, but session not found. Please try logging in again.");
                  }
                } catch (retryError) {
                  console.error("Session retry failed:", retryError);
                  setError("Login successful, but session update failed. Please refresh the page.");
                }
              }, 1000); // Wait 1 second before retry
            }
            
          } else {
            setMessage("Welcome back!");
            // Reset form immediately on success
            setPin(['', '', '', '']);
            setPhoneSuffix(['', '', '', '']);
            setShowPhoneSuffix(false);
            onStepChange?.(1);
          }
        } catch (sessionSetError) {
          console.error("Exception during session setting:", sessionSetError);
          setError("Login successful, but failed to update client session. Please refresh the page.");
        }
      } else {
        setError("Login successful, but no session data received. Please try again.");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="max-w-md mx-auto">
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200 text-center">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* PIN Input Boxes */}
          <div className="flex flex-col items-center space-y-6">
            {/* PIN Section */}
            <div className="flex flex-col items-center">
              <label className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">
                PIN
              </label>
              <div className="flex space-x-3">
                {pin.map((digit, index) => (
                  <div key={`pin-container-${index}`} className="relative">
                    <input
                      key={`pin-${index}`}
                      ref={el => pinRefs.current[index] = el}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'pin', index)}
                      onFocus={(e) => handleFocus(e)}
                      className="w-14 h-14 text-center text-xl font-semibold border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-200 dark:border-blue-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-800 transition-all bg-white"
                      maxLength={1}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      role="textbox"
                      aria-label={`PIN digit ${index + 1}`}
                      style={{ 
                        caretColor: '#3b82f6',
                        color: showPhoneSuffix ? 'transparent' : 'inherit'
                      }}
                    />
                    {/* Dot overlay - shows only when phone suffix is visible and digit is entered */}
                    {showPhoneSuffix && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div 
                          className={`w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 transform transition-all duration-200 ease-out ${
                            digit ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                          }`}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Phone Suffix Boxes - Animated with visible digits */}
            <div className={`flex flex-col items-center transition-all duration-500 ease-out ${
              showPhoneSuffix 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-4'
            }`}>
              {showPhoneSuffix && (
                <>
                  <label className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">
                    Last 4 Digits of Phone
                  </label>
                  <div className="flex space-x-3">
                    {phoneSuffix.map((digit, index) => (
                      <input
                        key={`phone-${index}`}
                        ref={el => phoneSuffixRefs.current[index] = el}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={digit}
                        onChange={(e) => handlePhoneSuffixChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'phone', index)}
                        onFocus={(e) => handleFocus(e)}
                        className="w-14 h-14 text-center text-xl font-semibold border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-200 dark:border-blue-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800 transition-all"
                        maxLength={1}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        role="textbox"
                        aria-label={`Phone digit ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          {showPhoneSuffix && (
            <div className={`transition-all duration-500 ease-out ${
              isPhoneSuffixComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <button 
                type="submit" 
                disabled={isLoading || !isPinComplete || !isPhoneSuffixComplete}
                className="w-full px-4 py-4 rounded-xl font-semibold text-base shadow transition border bg-blue-200 dark:bg-[#1a2655] border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-[#1e2a5a] hover:border-blue-500 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 