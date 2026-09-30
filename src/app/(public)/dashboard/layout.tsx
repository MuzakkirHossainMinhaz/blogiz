"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { PageEnter } from "@/components/motion";
import { Container } from "@/components/ui/Container";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-paper flex flex-col">
      <DashboardNav onToggleSidebar={toggleSidebar} sidebarOpen={isSidebarOpen} />

      <div className="flex flex-1 min-h-0">
        <aside
          className={`
            fixed z-40 w-[min(18rem,85vw)] bg-surface border-r border-neutral-200/80
            top-14 sm:top-16 bottom-0
            transform transition-transform duration-300 ease-in-out motion-reduce:transition-none
            lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:w-64 lg:shrink-0 lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-3 sm:p-4 h-full overflow-y-auto overscroll-contain" aria-label="Dashboard">
            <Sidebar onNavigate={closeSidebar} />
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden top-14 sm:top-16"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        <div className="flex-1 min-w-0">
          <main className="flex-1">
            <Container size="full" className="py-5 sm:py-6 lg:py-8">
              <PageEnter>{children}</PageEnter>
            </Container>
          </main>
        </div>
      </div>
    </div>
  );
}
