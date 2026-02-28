"use client";

import { APP_CONFIG, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiUser, FiX } from "react-icons/fi";

const navLinks = [
  { href: ROUTES.HOME, label: "Home" },
  { href: ROUTES.BLOGS, label: "Blogs" },
  { href: ROUTES.ABOUT, label: "About" },
  { href: ROUTES.SUPPORT, label: "Support" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const user = session?.user;

  const isActive = (href: string) => {
    if (href === ROUTES.HOME) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2 md:gap-3 group">
            <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" fill alt={`${APP_CONFIG.SITE_NAME} logo`} className="object-contain" priority />
            </div>
            <span className="text-xl md:text-2xl font-bold gradient-text">{APP_CONFIG.SITE_NAME}</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <ul className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all duration-200",
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
              // Logged In - Show Profile
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{user?.name || "Profile"}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              // Not Logged In - Show Auth Buttons
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
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

          {/* Mobile Right Side - Auth Buttons + Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiUser className="w-3.5 h-3.5 text-primary-600" />
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/secure/login"
                  className="px-3 py-1.5 text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={cn(
            "lg:hidden absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-lg",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          <div className="p-4 space-y-4">
            {/* Navigation Links */}
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-lg font-medium transition-all duration-200",
                      isActive(link.href) ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Mobile Menu Additional Options for Logged In User */}
            {isLoggedIn && (
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
