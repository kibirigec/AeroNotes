"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthProvider";
import SignUpForm from "../components/auth/SignUpForm";
import Link from "next/link";

export default function SignUpPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 p-4 md:min-h-screen md:flex md:flex-col md:items-center md:justify-center md:p-4 auth-page-mobile">
      <div className="w-full max-w-md space-y-8 auth-container-mobile md:space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="inline-block w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Create your account</h2>
          <p className="text-gray-600 dark:text-gray-400">Start taking notes and organizing your thoughts</p>
        </div>
        
        <SignUpForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 