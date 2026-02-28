"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-accent-50">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:text-primary-600 hover:bg-white transition-all duration-200"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
