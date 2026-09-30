"use client";

import { APP_CONFIG } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/permissions";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiLogOut, FiMenu, FiSettings, FiUser, FiX } from "react-icons/fi";

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  author: "Author",
  user: "Reader",
};

interface DashboardNavProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function DashboardNav({ onToggleSidebar, sidebarOpen }: DashboardNavProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const role = (user?.role as UserRole) || "user";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200/80 bg-surface/95 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl text-ink hover:bg-primary-50 transition-colors"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 shrink group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <Image
              src="/logo.png"
              fill
              sizes="36px"
              alt={`${APP_CONFIG.SITE_NAME} logo`}
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0 hidden xs:block sm:block">
            <p className="font-display text-base sm:text-lg font-semibold tracking-tight text-ink truncate leading-tight">
              {APP_CONFIG.SITE_NAME}
            </p>
            <p className="text-[11px] sm:text-xs text-accent-500 truncate leading-tight">Workspace</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center ml-2 pl-3 border-l border-neutral-200">
          <span className="inline-flex items-center min-h-8 px-2.5 rounded-lg bg-primary-50 text-primary-800 text-xs font-semibold border border-primary-100">
            {ROLE_LABEL[role]}
          </span>
        </div>

        <div className="flex-1" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "inline-flex items-center gap-2 min-h-11 pl-2 pr-2.5 sm:pr-3 rounded-xl border transition-colors",
              menuOpen
                ? "border-primary-200 bg-primary-50"
                : "border-neutral-200 bg-surface hover:bg-primary-50/70"
            )}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0">
              <FiUser className="w-4 h-4 text-primary-700" />
            </div>
            <div className="hidden sm:block text-left min-w-0 max-w-[10rem]">
              <p className="text-sm font-semibold text-ink truncate leading-tight">{user?.name || "Account"}</p>
              <p className="text-xs text-accent-500 truncate leading-tight">{user?.email}</p>
            </div>
            <FiChevronDown className={cn("w-4 h-4 text-accent-500 shrink-0 transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-surface shadow-soft-lg py-1.5 z-50"
            >
              <div className="px-3 py-2 border-b border-neutral-100 sm:hidden">
                <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                <p className="text-xs text-accent-500 truncate">{user?.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 min-h-11 px-3 text-sm text-accent-700 hover:bg-primary-50 hover:text-ink"
              >
                <FiSettings className="w-4 h-4 shrink-0" />
                Settings
              </Link>
              <Link
                href="/"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 min-h-11 px-3 text-sm text-accent-700 hover:bg-primary-50 hover:text-ink"
              >
                View public site
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-2.5 min-h-11 px-3 text-sm text-red-600 hover:bg-red-50"
              >
                <FiLogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
