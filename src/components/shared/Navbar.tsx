"use client";

import { APP_CONFIG, ROUTES } from "@/config/constants";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { FiMenu, FiX } from "react-icons/fi";
import { MOTION_DURATION, MOTION_EASE, usePrefersReducedMotion } from "@/components/motion";

const navLinks = [
  { href: ROUTES.HOME, label: "Home" },
  { href: ROUTES.BLOGS, label: "Blogs" },
  { href: ROUTES.ABOUT, label: "About" },
  { href: ROUTES.SUPPORT, label: "Support" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const { session, isAuthenticated } = useSessionStatus();
  const isLoggedIn = isAuthenticated;
  const user = session?.user;
  const isMobileMenuOpen = menuPath === pathname;
  const reduceMotion = usePrefersReducedMotion();

  const isDashboard = pathname.startsWith("/dashboard");

  const isActive = (href: string) => {
    if (href === ROUTES.HOME) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => setMenuPath(null);
  const toggleMobileMenu = () => setMenuPath((current) => (current === pathname ? null : pathname));

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-neutral-200/80">
      <div className="container-custom relative">
        {/*
          Three equal flex zones: brand | centered links | actions.
          Avoids broken arbitrary grid-template columns under Lightning CSS.
        */}
        <div className="flex h-14 items-center gap-3 sm:h-16 md:h-20">
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link href={ROUTES.HOME} className="group flex min-w-0 items-center gap-2.5 md:gap-3">
              <Image
                src="/logo.png"
                width={44}
                height={44}
                alt={`${APP_CONFIG.SITE_NAME} logo`}
                className="h-9 w-9 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100 md:h-11 md:w-11"
                priority
              />
              <span className="truncate font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl md:text-[1.65rem]">
                {APP_CONFIG.SITE_NAME}
              </span>
            </Link>
          </div>

          <ul className="hidden shrink-0 items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-xl px-4 py-2.5 font-medium transition-colors duration-200",
                    isActive(link.href)
                      ? "bg-primary-50 text-primary-800"
                      : "text-accent-500 hover:bg-primary-50/60 hover:text-ink"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              {isLoggedIn ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/dashboard"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors",
                      isDashboard ? "bg-primary-50" : "hover:bg-primary-50/70"
                    )}
                    aria-current={isDashboard ? "page" : undefined}
                  >
                    <div className="flex min-w-0 flex-col items-end">
                      <span className="max-w-40 truncate text-sm font-semibold leading-tight text-ink">
                        {user?.name || "User"}
                      </span>
                      <span className="max-w-40 truncate text-xs leading-tight text-accent-500">Dashboard</span>
                    </div>
                    <UserAvatar src={user?.avatar} name={user?.name} size="md" priority />
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-accent-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Sign Out"
                    title="Sign Out"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2.5 text-sm font-medium text-accent-500 transition-colors hover:text-ink"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors duration-200 hover:bg-primary-600"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
                  aria-label="Open Dashboard"
                >
                  <UserAvatar src={user?.avatar} name={user?.name} size="sm" priority />
                </Link>
              )}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
                aria-label="Toggle Menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <FiX className="h-6 w-6 text-ink" /> : <FiMenu className="h-6 w-6 text-ink" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="absolute top-full right-0 left-0 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-neutral-200 bg-surface shadow-soft-lg lg:hidden"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
            >
              <div className="space-y-3 p-3 sm:p-4">
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "block min-h-11 rounded-xl px-4 py-3 font-medium transition-colors duration-200",
                          isActive(link.href)
                            ? "bg-primary-50 text-primary-800"
                            : "text-accent-600 hover:bg-primary-50/70"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="space-y-1 border-t border-neutral-200 pt-3">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={closeMobileMenu}
                        className={cn(
                          "block min-h-11 rounded-xl px-4 py-3 font-medium transition-colors",
                          isDashboard ? "bg-primary-50 text-primary-800" : "text-accent-600 hover:bg-primary-50/70"
                        )}
                        aria-current={isDashboard ? "page" : undefined}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          signOut({ callbackUrl: "/" });
                        }}
                        className="min-h-11 w-full rounded-xl px-4 py-3 text-left font-medium text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={closeMobileMenu}
                        className="block min-h-11 rounded-xl px-4 py-3 font-medium text-accent-600 hover:bg-primary-50/70"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={closeMobileMenu}
                        className="block min-h-11 rounded-xl bg-primary-500 px-4 py-3 text-center font-semibold text-white hover:bg-primary-600"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-14 z-[-1] bg-ink/30 sm:top-16 md:top-20 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
