"use client";

import { APP_CONFIG, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiUser, FiX } from "react-icons/fi";
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
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
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
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-2">
          <Link href={ROUTES.HOME} className="flex items-center gap-2.5 md:gap-3 group min-w-0 shrink">
            <div className="relative w-9 h-9 md:w-11 md:h-11 shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100">
              <Image
                src="/logo.png"
                fill
                sizes="44px"
                alt={`${APP_CONFIG.SITE_NAME} logo`}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-display text-xl sm:text-2xl md:text-[1.65rem] font-semibold tracking-tight text-ink truncate">
              {APP_CONFIG.SITE_NAME}
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "px-4 py-2.5 rounded-xl font-medium transition-colors duration-200",
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

          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
                    isDashboard ? "bg-primary-50" : "hover:bg-primary-50/70"
                  )}
                  aria-current={isDashboard ? "page" : undefined}
                >
                  <div className="flex flex-col items-end min-w-0">
                    <span className="text-sm font-semibold text-ink leading-tight truncate max-w-40">
                      {user?.name || "User"}
                    </span>
                    <span className="text-xs text-accent-500 leading-tight truncate max-w-40">
                      Dashboard
                    </span>
                  </div>
                  <div className="w-9 h-9 shrink-0 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200">
                    <FiUser className="w-5 h-5 text-primary-700" />
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="min-h-11 min-w-11 p-2.5 rounded-xl text-accent-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="px-4 py-2.5 text-sm font-medium text-accent-500 hover:text-ink transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-soft transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="flex items-center justify-center min-h-11 min-w-11 rounded-xl hover:bg-primary-50 transition-colors"
                aria-label="Open dashboard"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border border-primary-200">
                  <FiUser className="w-4 h-4 text-primary-700" />
                </div>
              </Link>
            )}
            <button
              onClick={toggleMobileMenu}
              className="min-h-11 min-w-11 p-2.5 rounded-xl hover:bg-primary-50 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6 text-ink" /> : <FiMenu className="w-6 h-6 text-ink" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden absolute top-full left-0 right-0 bg-surface border-b border-neutral-200 shadow-soft-lg max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
            >
              <div className="p-3 sm:p-4 space-y-3">
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "block px-4 py-3 min-h-11 rounded-xl font-medium transition-colors duration-200",
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

                <div className="pt-3 border-t border-neutral-200 space-y-1">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={closeMobileMenu}
                        className={cn(
                          "block px-4 py-3 min-h-11 rounded-xl font-medium transition-colors",
                          isDashboard
                            ? "bg-primary-50 text-primary-800"
                            : "text-accent-600 hover:bg-primary-50/70"
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
                        className="w-full text-left px-4 py-3 min-h-11 rounded-xl font-medium text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={closeMobileMenu}
                        className="block px-4 py-3 min-h-11 rounded-xl font-medium text-accent-600 hover:bg-primary-50/70"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={closeMobileMenu}
                        className="block px-4 py-3 min-h-11 rounded-xl font-semibold text-center text-white bg-primary-500 hover:bg-primary-600"
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
          className="fixed inset-0 top-14 sm:top-16 md:top-20 z-[-1] bg-ink/30 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
