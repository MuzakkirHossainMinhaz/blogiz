import { APP_CONFIG, ROUTES } from "@/config/constants";
import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Blogs", href: ROUTES.BLOGS },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Support", href: ROUTES.SUPPORT },
];

const accountLinks = [
  { label: "Sign in", href: "/auth/login" },
  { label: "Create account", href: "/auth/register" },
  { label: "Dashboard", href: "/dashboard" },
];

const companyLinks = [
  { label: "About Blogiz", href: ROUTES.ABOUT },
  { label: "Support", href: ROUTES.SUPPORT },
];

const legalLinks = [
  { label: "Privacy", href: "/about#privacy" },
  { label: "Terms", href: "/about#terms" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-primary-100 border-t border-primary-800">
      <div className="container-custom">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5 max-w-md">
              <Link href={ROUTES.HOME} className="inline-flex items-center gap-3 mb-4 group">
                <div className="relative w-11 h-11 rounded-xl bg-white/10 p-1.5 transition-transform duration-200 group-hover:scale-105">
                  <Image
                    src="/logo.png"
                    fill
                    sizes="44px"
                    alt={`${APP_CONFIG.SITE_NAME} logo`}
                    className="object-contain p-1"
                  />
                </div>
                <span className="font-display text-2xl font-semibold tracking-tight text-white">
                  {APP_CONFIG.SITE_NAME}
                </span>
              </Link>
              <p className="text-primary-200/90 text-sm leading-relaxed">
                Blogiz is an editorial home for writers and readers — draft, publish, and share stories with a calm
                indigo craft built for multi-author blogs.
              </p>
            </div>

            <div className="sm:col-span-1 lg:col-span-2">
              <h3 className="font-display text-sm font-semibold text-white mb-3">Product</h3>
              <ul className="space-y-1">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm text-primary-200 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-1 lg:col-span-2">
              <h3 className="font-display text-sm font-semibold text-white mb-3">Account</h3>
              <ul className="space-y-1">
                {accountLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm text-primary-200 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <h3 className="font-display text-sm font-semibold text-white mb-3">Company</h3>
              <ul className="space-y-1 mb-6">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm text-primary-200 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <h3 className="font-display text-sm font-semibold text-white mb-3">Legal</h3>
              <ul className="space-y-1">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm text-primary-200 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="py-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-primary-300/80">
            © {currentYear} {APP_CONFIG.SITE_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-primary-400/70">Privacy and terms pages are placeholders until published.</p>
        </div>
      </div>
    </footer>
  );
}
