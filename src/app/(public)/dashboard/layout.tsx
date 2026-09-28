"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { Container } from "@/components/ui/Container";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login?callbackUrl=/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isSidebarOpen]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="bg-neutral-50 min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]">
      {/* Mobile dashboard nav bar — sits below site navbar */}
      <div className="lg:hidden sticky top-14 sm:top-16 md:top-20 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
            aria-label="Toggle dashboard menu"
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">Dashboard</p>
            <p className="text-xs text-neutral-500 truncate">Navigate sections</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar drawer / sticky column */}
        <aside
          className={`
            fixed z-40 w-[min(18rem,85vw)] bg-white border-r border-neutral-200
            top-14 sm:top-16 md:top-20 bottom-0
            transform transition-transform duration-300 ease-in-out motion-reduce:transition-none
            lg:sticky lg:top-20 lg:h-[calc(100dvh-5rem)] lg:w-64 lg:shrink-0 lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-3 sm:p-4 h-full overflow-y-auto overscroll-contain">
            <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-neutral-900/50 lg:hidden top-14 sm:top-16 md:top-20"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex-1 min-w-0">
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
