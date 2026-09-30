"use client";

import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { usePathname } from "next/navigation";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      <Navbar />
      {children}
      {!isDashboard && <Footer />}
    </>
  );
}
