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
      className={`relative rounded-full px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-500 flex items-center gap-1 overflow-hidden ${isAnimating ? 'scale-90' : 'scale-100'}`}
      aria-label="Toggle dark mode"
      disabled={isAnimating}
    >
      <div className={`transition-transform duration-500 ${isAnimating ? 'rotate-180' : ''}`}>
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71" /></svg>
        )}
      </div>
    </button>
  );
} 