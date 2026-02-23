"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const LogoutButton = ({ 
  className = "", 
  variant = "default",
  size = "default",
  children = "Logout",
  fullWidth = false
}: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: "/" 
      });
      
      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback redirect
      router.push("/");
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
      case "outline":
        return "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500";
      case "secondary":
        return "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500";
      case "ghost":
        return "text-gray-700 hover:bg-gray-100 focus:ring-gray-500";
      case "link":
        return "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500";
      default:
        return "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm";
      case "lg":
        return "px-6 py-3 text-lg";
      case "icon":
        return "p-2";
      default:
        return "px-4 py-2 text-sm font-medium";
    }
  };

  const baseClasses = "inline-flex items-center justify-center rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  const buttonClasses = `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${fullWidth ? 'w-full' : ''} ${className}`;

  if (!session) {
    return null; // Don't show logout button if not authenticated
  }

  if (showConfirm) {
    return (
      <div className="inline-flex items-center space-x-2">
        <span className="text-sm text-gray-600">Are you sure?</span>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`${buttonClasses} bg-red-600 hover:bg-red-700`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Yes
            </div>
          ) : (
            "Yes"
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          className={`${buttonClasses} ${getVariantClasses()}`}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={isLoading}
      className={buttonClasses}
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging out...
        </div>
      ) : (
        <>
          {children}
          {size !== "icon" && (
            <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
        </>
      )}
    </button>
  );
};

export default LogoutButton;
