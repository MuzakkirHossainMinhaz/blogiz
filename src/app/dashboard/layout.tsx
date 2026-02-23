"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import LogoutButton from "@/components/auth/LogoutButton";
import { Container } from "@/components/ui/Container";
import { FiMenu, FiX } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { APP_CONFIG } from "@/config/constants";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/auth/secure/login?callbackUrl=/dashboard");
    }
  }, [session, status, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 transition-transform group-hover:scale-110">
                <Image
                  src="/logo.png"
                  fill
                  alt={`${APP_CONFIG.SITE_NAME} logo`}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold gradient-text">
                {APP_CONFIG.SITE_NAME}
              </span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Desktop Header */}
            <div className="hidden lg:block p-6 border-b border-neutral-200">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
                  <Image
                    src="/logo.png"
                    fill
                    alt={`${APP_CONFIG.SITE_NAME} logo`}
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold gradient-text">
                  {APP_CONFIG.SITE_NAME}
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <Sidebar />
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-neutral-200">
              <div className="mb-3 p-3 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-900">
                  {session.user?.email}
                </p>
                <p className="text-xs text-neutral-500">
                  Administrator
                </p>
              </div>
              <LogoutButton 
                variant="outline" 
                size="sm" 
                fullWidth
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </LogoutButton>
            </div>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-neutral-900 bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white border-b border-neutral-200 sticky top-0 z-30">
            <Container>
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold text-neutral-900">
                    Dashboard
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-600">
                    {session.user?.email}
                  </span>
                  <LogoutButton variant="ghost" size="sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </LogoutButton>
                </div>
              </div>
            </Container>
          </div>

          {/* Page Content */}
          <main className="flex-1">
            <Container className="py-6">
              {children}
            </Container>
          </main>
        </div>
      </div>
    </div>
  );
}
