"use client";
import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // On mount, check localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle dark mode with animation
  const toggleDarkMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      // Reset animation state after a delay matching the CSS transition duration
      setTimeout(() => setIsAnimating(false), 800);
    }, 200);
  };

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