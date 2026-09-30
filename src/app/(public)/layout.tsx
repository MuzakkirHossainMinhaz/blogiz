import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { PublicChrome } from "@/components/shared/PublicChrome";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicChrome navbar={<Navbar />} footer={<Footer />}>
      {children}
    </PublicChrome>
  );
}
