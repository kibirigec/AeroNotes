"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthProvider";
import { PageLoadingSkeleton } from "./components/Skeletons";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  // Fallback landing page (shown briefly before redirect)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 p-4">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center mb-8">
          <span className="inline-block w-16 h-16 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-4" />
          <h1 className="text-6xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Your Personal Note-Taking App
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Organize your thoughts, store your documents, and keep your gallery all in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/signup"
            className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/login"
            className="px-8 py-3 text-lg font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Redirecting...
        </div>
      </div>
    </div>
  );
}
