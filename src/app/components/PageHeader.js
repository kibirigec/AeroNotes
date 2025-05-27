"use client";

export default function PageHeader() {
  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-white/70 dark:bg-blue-950/80 backdrop-blur-md shadow-sm border-b border-blue-100 dark:border-blue-900 z-20">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="inline-block w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-1 sm:mr-2 flex-shrink-0" />
        <h1 className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100 tracking-tight truncate">AeroNotes</h1>
      </div>
    </header>
  );
} 