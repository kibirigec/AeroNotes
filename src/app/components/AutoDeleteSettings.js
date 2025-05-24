"use client";

import { useState, useEffect } from 'react';
import { fetchAutoDeleteSettings, updateAutoDeleteSettings, formatDuration } from '../../../lib/autoDeleteService';

export default function AutoDeleteSettings() {
  const [settings, setSettings] = useState({
    document_timeout_seconds: 86400, // 24 hours default
    note_timeout_seconds: 3600,      // 1 hour default
    image_timeout_seconds: 43200,    // 12 hours default
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchAutoDeleteSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading auto-delete settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateAutoDeleteSettings(settings);
      setSaveMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving auto-delete settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    // Convert to number and ensure it's positive
    const numValue = Math.max(1, parseInt(value, 10) || 0);
    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Predefined timeout options in seconds
  const timeoutOptions = {
    documents: [
      { label: '1 hour', value: 3600 },
      { label: '12 hours', value: 43200 },
      { label: '1 day', value: 86400 },
      { label: '3 days', value: 259200 },
      { label: '7 days', value: 604800 },
    ],
    notes: [
      { label: '10 seconds', value: 10 },
      { label: '1 minute', value: 60 },
      { label: '10 minutes', value: 600 },
      { label: '1 hour', value: 3600 },
      { label: '1 day', value: 86400 },
    ],
    images: [
      { label: '1 hour', value: 3600 },
      { label: '6 hours', value: 21600 },
      { label: '12 hours', value: 43200 },
      { label: '1 day', value: 86400 },
      { label: '3 days', value: 259200 },
    ],
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm px-3 py-1.5 bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-dark)] text-white rounded-md transition-colors"
      >
        Auto-Delete Settings
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-Delete Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-blue)]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Auto-Delete Timeout
                </label>
                <div className="flex items-center">
                  <select
                    value={settings.document_timeout_seconds}
                    onChange={(e) => handleChange('document_timeout_seconds', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {timeoutOptions.documents.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value={settings.document_timeout_seconds}>
                      {!timeoutOptions.documents.some(opt => opt.value === settings.document_timeout_seconds) 
                        ? formatDuration(settings.document_timeout_seconds) + ' (custom)'
                        : null}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note Auto-Delete Timeout
                </label>
                <div className="flex items-center">
                  <select
                    value={settings.note_timeout_seconds}
                    onChange={(e) => handleChange('note_timeout_seconds', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {timeoutOptions.notes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value={settings.note_timeout_seconds}>
                      {!timeoutOptions.notes.some(opt => opt.value === settings.note_timeout_seconds) 
                        ? formatDuration(settings.note_timeout_seconds) + ' (custom)'
                        : null}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image Auto-Delete Timeout
                </label>
                <div className="flex items-center">
                  <select
                    value={settings.image_timeout_seconds}
                    onChange={(e) => handleChange('image_timeout_seconds', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {timeoutOptions.images.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value={settings.image_timeout_seconds}>
                      {!timeoutOptions.images.some(opt => opt.value === settings.image_timeout_seconds) 
                        ? formatDuration(settings.image_timeout_seconds) + ' (custom)'
                        : null}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                    {saveMessage}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 py-2 ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-dark)]'
                  } text-white rounded-md transition-colors ml-auto`}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 