"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { Container } from "@/components/ui/Container";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <div className="bg-neutral-50">
      {/* Mobile Menu Button - Top Right */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-2.5 md:top-5 right-4 z-50 p-2 rounded-lg bg-white shadow-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out
          lg:sticky top-16.5 lg:top-20.25 lg:h-[calc(100vh-5rem)] lg:transform-none
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          {/* Navigation */}
          <nav className="p-4 h-full overflow-y-auto">
            <Sidebar />
          </nav>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-30 bg-neutral-900/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Page Content */}
          <main className="flex-1">
            <Container size="full" className="py-4 sm:py-6 lg:py-8">
              {children}
            </Container>
          </main>
        </div>
      </div>
    </div>
  );
}
