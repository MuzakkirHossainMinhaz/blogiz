"use client";

import { APP_CONFIG, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiUser, FiX } from "react-icons/fi";

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
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="container-custom relative">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-2">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2 md:gap-3 group min-w-0 shrink">
            <div className="relative w-8 h-8 md:w-10 md:h-10 shrink-0 transition-transform group-hover:scale-110 motion-reduce:group-hover:scale-100">
              <Image src="/logo.png" fill alt={`${APP_CONFIG.SITE_NAME} logo`} className="object-contain" priority />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold gradient-text truncate">{APP_CONFIG.SITE_NAME}</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <ul className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                    isActive(link.href)
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Right Side - Auth Buttons or Profile */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex flex-col items-end min-w-0">
                    <span className="text-md font-semibold text-neutral-900 leading-tight truncate max-w-40">
                      {user?.name || "User"}
                    </span>
                    <span className="text-xs text-neutral-500 leading-tight truncate max-w-40">
                      @{user?.email?.split("@")[0] || "username"}
                    </span>
                  </div>
                  <div className="w-9 h-9 shrink-0 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-2 border-primary-200">
                    <FiUser className="w-5 h-5 text-primary-600" />
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="min-h-11 min-w-11 p-2.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                  className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="flex items-center justify-center min-h-11 min-w-11 rounded-lg hover:bg-neutral-50 transition-colors"
                aria-label="Open dashboard"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-primary-600" />
                </div>
              </Link>
            )}
            <button
              onClick={toggleMobileMenu}
              className="min-h-11 min-w-11 p-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={cn(
            "lg:hidden absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-lg max-h-[calc(100dvh-3.5rem)] overflow-y-auto",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          <div className="p-3 sm:p-4 space-y-3">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "block px-4 py-3 min-h-11 rounded-lg font-medium transition-all duration-200",
                      isActive(link.href) ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-50"
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
                    className="block px-4 py-3 min-h-11 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-4 py-3 min-h-11 rounded-lg font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 min-h-11 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 min-h-11 rounded-lg font-semibold text-center text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-14 sm:top-16 md:top-20 z-[-1] bg-neutral-900/40 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
