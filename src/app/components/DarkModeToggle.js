"use client";
import { useTheme } from "../../../lib/ThemeContext";

export default function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  // Debug function to force reset theme
  const forceResetTheme = () => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    localStorage.setItem('theme', 'light');
    html.classList.add('light');
    html.style.colorScheme = 'light';
    document.body.style.colorScheme = 'light';
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: 'light' } 
    }));
    
    console.log('Force reset to light mode');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
      >
        {isDark ? (
          // Sun icon for light mode switch
          <svg
            className="h-5 w-5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Moon icon for dark mode switch
          <svg
            className="h-5 w-5 text-slate-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
      
      {/* Debug button - remove this after testing */}
      <button
        onClick={forceResetTheme}
        className="px-2 py-1 text-xs bg-red-500 text-white rounded opacity-50 hover:opacity-100"
        title="Force reset to light mode (debug)"
      >
        Reset
      </button>
    </div>
  );
} 