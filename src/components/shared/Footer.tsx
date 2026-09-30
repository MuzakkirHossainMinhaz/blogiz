import { APP_CONFIG, ROUTES } from "@/config/constants";
import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
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

const legalLinks = [
  { label: "Privacy", href: ROUTES.PRIVACY },
  { label: "Terms", href: ROUTES.TERMS },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-primary-100 border-t border-primary-800">
      {/* daisyUI footer layout: https://daisyui.com/components/footer/ */}
      <div className="footer sm:footer-horizontal items-start container-custom py-10 md:py-12 gap-8 md:gap-10">
        <aside className="max-w-sm">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 group mb-1">
            <Image
              src="/logo.png"
              width={44}
              height={44}
              alt={`${APP_CONFIG.SITE_NAME} logo`}
              className="h-11 w-11 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100"
            />
            <span className="font-display text-2xl font-semibold tracking-tight text-white leading-none">
              {APP_CONFIG.SITE_NAME}
            </span>
          </Link>
          <p className="text-primary-200/90 text-sm leading-relaxed">
            An editorial home for writers and readers — draft, publish, and share stories with a calm indigo craft.
          </p>
        </aside>

        <nav aria-label="Explore">
          <h6 className="footer-title text-primary-300 opacity-100">Explore</h6>
          {exploreLinks.map((link) => (
            <Link key={link.label} href={link.href} className="link link-hover text-primary-100/90 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Account">
          <h6 className="footer-title text-primary-300 opacity-100">Account</h6>
          {accountLinks.map((link) => (
            <Link key={link.label} href={link.href} className="link link-hover text-primary-100/90 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legal">
          <h6 className="footer-title text-primary-300 opacity-100">Legal</h6>
          {legalLinks.map((link) => (
            <Link key={link.label} href={link.href} className="link link-hover text-primary-100/90 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container-custom py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-primary-300/80">
            © {currentYear} {APP_CONFIG.SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm text-primary-300/80">
            <Link href={ROUTES.PRIVACY} className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href={ROUTES.TERMS} className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
