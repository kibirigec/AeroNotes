/**
 * Auto Signout Settings Component
 * Settings for managing auto signout behavior
 */

import { useState, useEffect } from 'react';

const AutoSignoutSettings = ({ settings, onSettingsChange, isSaving }) => {
  const [localSettings, setLocalSettings] = useState({
    enabled: true,
    desktopTimeout: 20,
    mobileTimeout: 10
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        enabled: settings.enabled,
        desktopTimeout: settings.desktopTimeout || 20,
        mobileTimeout: settings.mobileTimeout || 10
      });
    }
  }, [settings]);

  const handleEnabledChange = (enabled) => {
    const newSettings = { ...localSettings, enabled };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleTimeoutChange = (type, value) => {
    const newSettings = { 
      ...localSettings, 
      [type]: parseInt(value)
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const timeoutOptions = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' }
  ];

  return (
    <div className="space-y-6">
      {/* Enable/Disable Auto Signout */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Auto Signout</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automatically sign out after a period of inactivity to protect your account
          </p>
        </div>
        <div className="ml-4">
          <button
            onClick={() => handleEnabledChange(!localSettings.enabled)}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              localSettings.enabled 
                ? 'bg-blue-600' 
                : 'bg-gray-200 dark:bg-gray-600'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                localSettings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Timeout Settings */}
      {localSettings.enabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Timeout */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                💻 Desktop Timeout
              </label>
              <select
                value={localSettings.desktopTimeout}
                onChange={(e) => handleTimeoutChange('desktopTimeout', e.target.value)}
                disabled={isSaving}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
              >
                {timeoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Timeout when using a computer or laptop
              </p>
            </div>

            {/* Mobile Timeout */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                📱 Mobile Timeout
              </label>
              <select
                value={localSettings.mobileTimeout}
                onChange={(e) => handleTimeoutChange('mobileTimeout', e.target.value)}
                disabled={isSaving}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
              >
                {timeoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Timeout when using a phone or tablet
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  How Auto Signout Works
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Timer automatically pauses while you're actively typing</li>
                    <li>Any mouse, keyboard, or touch activity resets the timer</li>
                    <li>You'll get a 2-minute warning before being signed out</li>
                    <li>Unsaved changes will prevent automatic signout</li>
                    <li>Different timeouts apply based on your device type</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Current Settings</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>• Desktop: Sign out after {localSettings.desktopTimeout} minutes of inactivity</div>
              <div>• Mobile: Sign out after {localSettings.mobileTimeout} minutes of inactivity</div>
              <div>• Warning: 2 minutes before automatic signout</div>
            </div>
          </div>
        </div>
      )}

      {/* Disabled State Info */}
      {!localSettings.enabled && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Auto Signout Disabled
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                Your session will remain active until you manually sign out or close the browser. 
                For better security, consider enabling auto signout, especially on shared devices.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSignoutSettings; 