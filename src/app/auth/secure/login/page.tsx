"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { Container } from "@/components/ui/Container";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-accent-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render login page if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <Container className="max-w-md">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block group">
              <h1 className="text-3xl font-bold gradient-text transition-transform group-hover:scale-105">
                Blogiz
              </h1>
            </Link>
            <h2 className="mt-6 text-2xl font-bold text-neutral-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Or{" "}
              <Link href="/" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                return to homepage
              </Link>
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg card-hover">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-900 text-center">
                Admin Dashboard Access
              </h3>
              <p className="mt-1 text-sm text-neutral-500 text-center">
                Enter your credentials to access the admin dashboard
              </p>
            </div>
            
            <LoginForm />
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-neutral-500">
              Protected admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
