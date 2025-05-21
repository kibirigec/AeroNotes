"use client";
import DarkModeToggle from "./DarkModeToggle"; // Assuming DarkModeToggle is in the same directory

export default function PageHeader({ user, isAuthenticated, onLogout, onLogin }) {
  return (
    <header className="w-full flex items-center justify-between px-8 py-6 bg-white/70 dark:bg-blue-950/80 backdrop-blur-md shadow-sm border-b border-blue-100 dark:border-blue-900 z-20">
      <div className="flex items-center gap-2">
        <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-2" />
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated && user && (
          <span className="text-sm text-blue-700 dark:text-blue-300 hidden sm:inline-block">
            {user.email}
          </span>
        )}
        <DarkModeToggle />
        {isAuthenticated ? (
          <button 
            onClick={onLogout}
            className="rounded-full bg-blue-600 text-white px-4 py-2 font-medium shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition"
          >
            Logout
          </button>
        ) : (
          <button 
            onClick={onLogin}
            className="rounded-full bg-blue-600 text-white px-4 py-2 font-medium shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
} 