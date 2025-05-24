"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check current DOM state first
    const html = document.documentElement;
    const currentThemeFromDOM = html.classList.contains('dark') ? 'dark' : 'light';
    
    // Initialize theme from localStorage only on client
    const savedTheme = localStorage.getItem('theme') || currentThemeFromDOM || 'light';
    
    // Ensure theme state matches what we want to apply
    setTheme(savedTheme);
    
    // Apply initial theme
    applyThemeToDocument(savedTheme);

    // Listen for theme changes from other components
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setTheme(newTheme);
      applyThemeToDocument(newTheme);
    };

    // Listen for manual localStorage changes (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
        applyThemeToDocument(e.newValue);
      }
    };

    window.addEventListener('themeChange', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const applyThemeToDocument = (newTheme) => {
    if (typeof window === 'undefined') return; // Skip on server
    
    const html = document.documentElement;
    
    // Remove any existing theme classes first
    html.classList.remove('dark', 'light');
    
    // Apply new theme class
    html.classList.add(newTheme);
    
    // Force a repaint to ensure all styles are applied immediately
    html.offsetHeight;
    
    console.log(`Applied theme: ${newTheme}, HTML classes:`, html.className);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    // Apply theme to document
    applyThemeToDocument(newTheme);

    // Dispatch event for other listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('themeChange', { 
        detail: { theme: newTheme } 
      }));
    }

    console.log(`Theme toggled to: ${newTheme}`); // Debug log
  };

  // Return a consistent structure for SSR/client hydration
  return (
    <ThemeContext.Provider value={{ 
      theme: mounted ? theme : 'light', 
      toggleTheme, 
      isDark: mounted ? theme === 'dark' : false 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 