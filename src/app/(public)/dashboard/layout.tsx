"use client";

import { PageEnter } from "@/components/motion";
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
  const [sidebarPath, setSidebarPath] = useState<string | null>(null);
  const isSidebarOpen = sidebarPath === pathname;

  const closeSidebar = () => setSidebarPath(null);
  const toggleSidebar = () => setSidebarPath((current) => (current === pathname ? null : pathname));

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login?callbackUrl=/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
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
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="bg-paper min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]">
      {/* Mobile sidebar control — same chrome language as Navbar, not a second product header */}
      <div className="lg:hidden sticky top-14 sm:top-16 md:top-20 z-30 border-b border-neutral-200/80 bg-surface/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-2">
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl text-ink hover:bg-primary-50 transition-colors"
            aria-label="Toggle dashboard menu"
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-ink truncate">Workspace</p>
            <p className="text-xs text-accent-500 truncate">Same Blogiz chrome, dashboard tools</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-[inherit]">
        <aside
          className={`
            fixed z-40 w-[min(18rem,85vw)] bg-surface border-r border-neutral-200/80
            top-14 sm:top-16 md:top-20 bottom-0
            transform transition-transform duration-300 ease-in-out motion-reduce:transition-none
            lg:sticky lg:top-20 lg:h-[calc(100dvh-5rem)] lg:w-64 lg:shrink-0 lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-3 sm:p-4 h-full overflow-y-auto overscroll-contain" aria-label="Dashboard">
            <Sidebar onNavigate={closeSidebar} />
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden top-14 sm:top-16 md:top-20"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        <div className="flex-1 min-w-0">
          <main className="flex-1">
            <Container size="full" className="py-5 sm:py-6 lg:py-8 max-w-6xl">
              <PageEnter>{children}</PageEnter>
            </Container>
          </main>
        </div>
      </div>
    </div>
  );
}
