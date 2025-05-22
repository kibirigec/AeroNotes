"use client";
import { useState, useEffect } from "react";

// Helper function to apply theme to all force-theme elements
const applyThemeToElements = (isDark) => {
  const elements = document.querySelectorAll('.force-theme');
  elements.forEach(el => {
    el.style.colorScheme = isDark ? 'dark' : 'light';
  });
};

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount, check only localStorage - no system preference
  useEffect(() => {
    // Set mounted flag so we only render on client
    setMounted(true);
    
    // Force light mode as default if nothing in localStorage
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-mode", "dark");
      // Enforce dark mode styling
      document.documentElement.style.colorScheme = "dark";
      applyThemeToElements(true);
    } else {
      // Explicit light mode - remove dark mode classes and add light mode
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      document.documentElement.setAttribute("data-mode", "light");
      // Enforce light mode styling
      document.documentElement.style.colorScheme = "light";
      applyThemeToElements(false);
    }

    // Block and override any browser preference changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const mediaQueryListener = () => {
      // Force the theme based on user preference, not browser
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-mode", "dark");
        document.documentElement.style.colorScheme = "dark";
        applyThemeToElements(true);
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-mode", "light");
        document.documentElement.style.colorScheme = "light";
        applyThemeToElements(false);
      }
    };
    
    // Apply immediately and on changes
    mediaQueryListener();
    darkModeMediaQuery.addEventListener('change', mediaQueryListener);

    return () => {
      darkModeMediaQuery.removeEventListener('change', mediaQueryListener);
    };
  }, []);

  // Toggle dark mode with animation
  const toggleDarkMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-mode", "dark");
        localStorage.setItem("theme", "dark");
        document.documentElement.style.colorScheme = "dark";
        applyThemeToElements(true);
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-mode", "light");
        localStorage.setItem("theme", "light");
        document.documentElement.style.colorScheme = "light";
        applyThemeToElements(false);
      }
      // Reset animation state after a delay matching the CSS transition duration
      setTimeout(() => setIsAnimating(false), 800);
    }, 200);
  };

  // Don't render anything during SSR
  if (!mounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className={`relative w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out flex items-center justify-center overflow-hidden ${isAnimating ? 'scale-95' : 'scale-100'}`}
      aria-label="Toggle dark mode"
      disabled={isAnimating}
    >
      <div className={`absolute transition-all duration-300 ease-in-out ${darkMode ? 'opacity-0 -translate-x-full rotate-180' : 'opacity-100 translate-x-0 rotate-0'}`}>
        {/* Sun Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71" /></svg>
      </div>
      <div className={`absolute transition-all duration-300 ease-in-out ${darkMode ? 'opacity-100 translate-x-0 rotate-0' : 'opacity-0 translate-x-full -rotate-180'}`}>
        {/* Moon Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
      </div>
    </button>
  );
} 