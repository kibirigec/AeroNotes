"use client";

export default function PageHeader({ user, isAuthenticated, onLogout, onLogin }) {
  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-white/70 dark:bg-blue-950/80 backdrop-blur-md shadow-sm border-b border-blue-100 dark:border-blue-900 z-20">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="inline-block w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-1 sm:mr-2 flex-shrink-0" />
        <h1 className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100 tracking-tight truncate">AeroNotes</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {isAuthenticated && user && (
          <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 hidden sm:inline-block max-w-24 sm:max-w-32 md:max-w-none truncate">
            {user.email}
          </span>
        )}
        {isAuthenticated ? (
          <button 
            onClick={onLogout}
            className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow transition text-sm sm:text-base whitespace-nowrap"
          >
            Logout
          </button>
        ) : (
          <button 
            onClick={onLogin}
            className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow transition text-sm sm:text-base whitespace-nowrap"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
} 