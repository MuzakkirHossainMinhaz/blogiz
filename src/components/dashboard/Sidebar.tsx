"use client";

import { cn } from "@/lib/utils";
import { hasPermission, UserRole, Permission } from "@/lib/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconType } from "react-icons";
import {
  FiBarChart2,
  FiEdit3,
  FiFileText,
  FiGrid,
  FiHome,
  FiImage,
  FiSettings,
  FiUsers,
  FiShield,
  FiArrowUpCircle,
} from "react-icons/fi";

interface NavItem {
  name: string;
  href: string;
  icon: IconType;
  current: (pathname: string) => boolean;
  requiredPermission: keyof Permission["can"];
  roles?: UserRole[];
}

const readerNavigation: NavItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: FiHome,
    current: (pathname: string) => pathname === "/dashboard",
    requiredPermission: "viewDashboard",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: FiSettings,
    current: (pathname: string) => pathname === "/dashboard/settings",
    requiredPermission: "editOwnProfile",
  },
];

const authorNavigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: FiHome,
    current: (pathname: string) => pathname === "/dashboard",
    requiredPermission: "viewDashboard",
  },
  {
    name: "My Posts",
    href: "/dashboard/blogs",
    icon: FiFileText,
    current: (pathname: string) => pathname.startsWith("/dashboard/blogs"),
    requiredPermission: "createBlog",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: FiBarChart2,
    current: (pathname: string) => pathname === "/dashboard/analytics",
    requiredPermission: "createBlog",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: FiSettings,
    current: (pathname: string) => pathname === "/dashboard/settings",
    requiredPermission: "editOwnProfile",
  },
];

const adminNavigation: NavItem[] = [
  {
    name: "Admin Panel",
    href: "/dashboard/admin",
    icon: FiShield,
    current: (pathname: string) => pathname === "/dashboard/admin",
    requiredPermission: "viewAdminDashboard",
  },
  {
    name: "Users",
    href: "/dashboard/admin/users",
    icon: FiUsers,
    current: (pathname: string) => pathname.startsWith("/dashboard/admin/users"),
    requiredPermission: "viewUsers",
  },
  {
    name: "Banners",
    href: "/dashboard/admin/banners",
    icon: FiImage,
    current: (pathname: string) => pathname.startsWith("/dashboard/admin/banners"),
    requiredPermission: "manageBanners",
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const canCreateBlog = hasPermission(userRole, "createBlog");
  const isReader = userRole === "user";

  const mainNav = (isReader ? readerNavigation : authorNavigation).filter((item) =>
    hasPermission(userRole, item.requiredPermission)
  );
  const adminNav = adminNavigation.filter((item) => hasPermission(userRole, item.requiredPermission));

  const linkClass = (isActive: boolean) =>
    cn(
      "group flex items-center min-h-11 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200",
      isActive
        ? "bg-primary-50 text-primary-800"
        : "text-accent-600 hover:bg-primary-50/70 hover:text-ink"
    );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {isReader ? "Account" : "Workspace"}
        </h3>
        <div className="mt-3 space-y-1">
          {mainNav.map((item) => {
            const isActive = item.current(pathname);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} onClick={onNavigate} className={linkClass(isActive)}>
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0",
                    isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-primary-600"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {adminNav.length > 0 && (
        <div>
          <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Administration</h3>
          <div className="mt-3 space-y-1">
            {adminNav.map((item) => {
              const isActive = item.current(pathname);
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} onClick={onNavigate} className={linkClass(isActive)}>
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0",
                      isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-primary-600"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {canCreateBlog && (
        <div>
          <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quick actions</h3>
          <div className="mt-3 space-y-1">
            <Link
              href="/dashboard/blogs/create"
              onClick={onNavigate}
              className="group flex items-center min-h-11 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200 bg-primary-500 text-white hover:bg-primary-600 shadow-soft"
            >
              <FiEdit3 className="mr-3 h-5 w-5 shrink-0" />
              Write New Post
            </Link>
          </div>
        </div>
      )}

      {isReader && (
        <div>
          <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Grow</h3>
          <div className="mt-3 space-y-1">
            <Link
              href="/dashboard/settings#role-upgrade"
              onClick={onNavigate}
              className={linkClass(false)}
            >
              <FiArrowUpCircle className="mr-3 h-5 w-5 shrink-0 text-neutral-400 group-hover:text-primary-600" />
              Become An Author
            </Link>
          </div>
        </div>
      )}

      <div>
        <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Site</h3>
        <div className="mt-3 space-y-1">
          <Link href="/" onClick={onNavigate} className={linkClass(false)}>
            <FiGrid className="mr-3 h-5 w-5 shrink-0 text-neutral-400 group-hover:text-primary-600" />
            View Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
