"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBarChart2, FiEdit3, FiFileText, FiGrid, FiHome, FiSettings } from "react-icons/fi";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: FiHome,
    current: (pathname: string) => pathname === "/dashboard",
  },
  {
    name: "Blogs",
    href: "/dashboard/blogs",
    icon: FiFileText,
    current: (pathname: string) => pathname.startsWith("/dashboard/blogs"),
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: FiBarChart2,
    current: (pathname: string) => pathname === "/dashboard/analytics",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: FiSettings,
    current: (pathname: string) => pathname === "/dashboard/settings",
  },
];

const secondaryNavigation = [
  {
    name: "View Site",
    href: "/",
    icon: FiGrid,
    external: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Main Navigation */}
      <div>
        <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Main Menu</h3>
        <div className="mt-3 space-y-1">
          {navigation.map((item) => {
            const isActive = item.current(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                    : "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0",
                    isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-primary-600"
                  )}
                />
                {item.name}
                {isActive && <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full"></div>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quick Actions</h3>
        <div className="mt-3 space-y-1">
          <Link
            href="/dashboard/blogs/create"
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-linear-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-sm hover:shadow-md"
          >
            <FiEdit3 className="mr-3 h-5 w-5 shrink-0" />
            Write New Post
          </Link>
        </div>
      </div>

      {/* Secondary Navigation */}
      <div>
        <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">External</h3>
        <div className="mt-3 space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                )}
                {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
              >
                <Icon className="mr-3 h-5 w-5 shrink-0 text-neutral-400 group-hover:text-primary-600" />
                {item.name}
                {item.external && (
                  <svg
                    className="ml-auto w-4 h-4 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-3 py-4 bg-linear-to-br from-primary-50 to-accent-50 rounded-lg border border-primary-100">
        <h4 className="text-sm font-medium text-primary-900 mb-2">Quick Stats</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-primary-700">Total Posts</span>
            <span className="font-medium text-primary-900">--</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary-700">Total Likes</span>
            <span className="font-medium text-primary-900">--</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary-700">Drafts</span>
            <span className="font-medium text-primary-900">--</span>
          </div>
        </div>
      </div>
    </div>
  );
}
