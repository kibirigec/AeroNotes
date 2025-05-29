/**
 * Theme Settings Component
 * Settings for managing app appearance and theme
 */

const ThemeSettings = ({ currentTheme, onThemeChange, isSaving }) => {
  const themes = [
    {
      id: 'light',
      name: 'Light Mode',
      description: 'Clean, bright interface',
      icon: '☀️',
      preview: 'bg-white border-gray-200'
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Easy on the eyes in low light',
      icon: '🌙',
      preview: 'bg-gray-900 border-gray-700'
    },
    {
      id: 'system',
      name: 'System Default',
      description: 'Matches your device settings',
      icon: '💻',
      preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Choose Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              disabled={isSaving}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                currentTheme === theme.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Selected indicator */}
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Theme preview */}
              <div className={`w-full h-16 rounded-md border mb-3 ${theme.preview}`}>
                <div className="p-2 h-full flex items-center justify-center">
                  <span className="text-2xl">{theme.icon}</span>
                </div>
              </div>

              {/* Theme info */}
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">{theme.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{theme.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Appearance Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Additional Settings</h3>
        
        <div className="space-y-4">
          {/* Compact mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compact mode</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reduce spacing for more content per screen</p>
            </div>
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable animations</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Smooth transitions and effects</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Font size */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font size</label>
            <select className="mt-1 block w-full md:w-48 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm" defaultValue="medium">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Preview</h3>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Sample Note Title</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">2 min ago</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              This is how your content will look with the selected theme. 
              The interface adapts to provide the best reading experience.
            </div>
            <div className="flex space-x-2">
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                Sample Tag
              </div>
              <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                Another Tag
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Theme Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Current Theme: {themes.find(t => t.id === currentTheme)?.name}
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              {currentTheme === 'system' 
                ? 'The app will automatically switch between light and dark modes based on your device settings.'
                : `You're using ${currentTheme} mode. You can change this anytime from the preferences.`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings; 