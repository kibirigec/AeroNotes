"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthProvider";
import LoginForm from "../components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

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

  const getInstructionText = () => {
    return currentStep === 1 
      ? "Enter your PIN to continue"
      : "Last 4 digits of phone number";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 p-4 md:min-h-screen md:flex md:flex-col md:items-center md:justify-center md:p-4 auth-page-mobile">
      <div className="w-full max-w-md space-y-8 auth-container-mobile md:space-y-8">
        <div className="p-8 border-2 border-blue-200 dark:border-blue-700 rounded-2xl bg-white/80 dark:bg-blue-950/70 shadow-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <span className="inline-block w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-3" />
              <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
            </div>
            <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-2">Welcome back</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 transition-all duration-300">
              {getInstructionText()}
            </p>
          </div>
          
          <LoginForm onStepChange={setCurrentStep} />
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link 
                href="/signup" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 