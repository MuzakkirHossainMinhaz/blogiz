import { APP_CONFIG, ROUTES } from "@/config/constants";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const footerLinks = [
  { label: "Blogs", href: ROUTES.BLOGS },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Support", href: ROUTES.SUPPORT },
];

const socialLinks = [
  { icon: FaTwitter, href: "#", label: "Twitter" },
  { icon: FaGithub, href: "#", label: "GitHub" },
  { icon: FaLinkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-primary-100 border-t border-primary-800">
      <div className="container-custom">
        <div className="py-12 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
            <div className="max-w-md">
              <Link href={ROUTES.HOME} className="inline-flex items-center gap-3 mb-4 group">
                <div className="relative w-12 h-12 rounded-xl bg-white/10 p-1.5 transition-transform duration-200 group-hover:scale-105">
                  <Image
                    src="/logo.png"
                    fill
                    sizes="48px"
                    alt={`${APP_CONFIG.SITE_NAME} logo`}
                    className="object-contain p-1"
                  />
                </div>
                <span className="font-display text-2xl font-semibold tracking-tight text-white">
                  {APP_CONFIG.SITE_NAME}
                </span>
              </Link>
              <p className="text-primary-200/90 text-sm leading-relaxed">
                Write, publish, and share stories with a calm editorial home for your ideas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 sm:gap-14">
              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-3">Explore</h3>
                <ul className="space-y-2">
                  {footerLinks.map((link) => (
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

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-3">Connect</h3>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 min-h-10 min-w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary-200 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <social.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-5 border-t border-white/10">
          <p className="text-sm text-primary-300/80 text-center md:text-left">
            © {currentYear} {APP_CONFIG.SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
