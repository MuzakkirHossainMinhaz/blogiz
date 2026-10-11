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

function FooterNav({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h6 className="text-sm font-semibold tracking-wide text-primary-300 uppercase">{title}</h6>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-primary-100/90 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-primary-800 bg-ink text-primary-100">
      <div className="container-custom grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 md:py-12 lg:grid-cols-4 lg:gap-8">
        <div className="max-w-sm sm:col-span-2 lg:col-span-1">
          <Link href={ROUTES.HOME} className="group mb-3 flex items-center gap-3">
            <Image
              src="/logo.png"
              width={44}
              height={44}
              alt={`${APP_CONFIG.SITE_NAME} logo`}
              className="h-11 w-11 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100"
            />
            <span className="font-display text-2xl font-semibold leading-none tracking-tight text-white">
              {APP_CONFIG.SITE_NAME}
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-primary-200/90">
            An editorial home for writers and readers — draft, publish, and share stories with a calm indigo craft.
          </p>
        </div>

        <FooterNav title="Explore" links={exploreLinks} />
        <FooterNav title="Account" links={accountLinks} />
        <FooterNav title="Legal" links={legalLinks} />
      </div>

      <div className="border-t border-white/10">
        <div className="container-custom flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-primary-300/80">
            © {currentYear} {APP_CONFIG.SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm text-primary-300/80">
            <Link href={ROUTES.PRIVACY} className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href={ROUTES.TERMS} className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
