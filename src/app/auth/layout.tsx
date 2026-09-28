"use client";

import { PageEnter } from "@/components/motion";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-paper relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 10% 0%, rgba(192, 200, 255, 0.45), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 100%, rgba(123, 133, 240, 0.12), transparent 50%),
            #f7f6ff
          `,
        }}
      />

      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-11 px-4 py-2 text-sm font-medium text-accent-600 bg-surface/90 border border-neutral-200 rounded-xl shadow-soft hover:text-ink hover:bg-white transition-colors duration-200"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span className="sm:hidden">Home</span>
          <span className="hidden sm:inline">Back to Home</span>
        </Link>
      </div>

      <main className="min-h-screen flex items-center justify-center py-16 sm:py-12 px-4 sm:px-6 lg:px-8">
        <PageEnter className="w-full flex justify-center">{children}</PageEnter>
      </main>
    </div>
  );
}
