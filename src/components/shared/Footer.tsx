import { APP_CONFIG, ROUTES } from "@/config/constants";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaHeart, FaLinkedin, FaTwitter } from "react-icons/fa";

const footerLinks = {
  product: [
    { label: "Features", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  company: [
    { label: "About", href: ROUTES.ABOUT },
    { label: "Blogs", href: ROUTES.BLOGS },
    { label: "Careers", href: "#" },
  ],
  support: [
    { label: "Help Center", href: ROUTES.SUPPORT },
    { label: "Contact", href: "#" },
    { label: "Status", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socialLinks = [
  { icon: FaTwitter, href: "#", label: "Twitter" },
  { icon: FaGithub, href: "#", label: "GitHub" },
  { icon: FaLinkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-linear-to-br from-neutral-50 to-primary-50/30 border-t border-neutral-200">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link href={ROUTES.HOME} className="flex items-center gap-3 mb-4 group">
                <div className="relative w-12 h-12 transition-transform group-hover:scale-110">
                  <Image src="/logo.png" fill alt={`${APP_CONFIG.SITE_NAME} logo`} className="object-contain" />
                </div>
                <span className="text-2xl font-bold gradient-text">{APP_CONFIG.SITE_NAME}</span>
              </Link>
              <p className="text-neutral-600 mb-6 max-w-sm">{APP_CONFIG.SITE_DESCRIPTION}</p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-neutral-600 hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-neutral-600 hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-neutral-600 hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-neutral-600 hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
            <p className="text-sm text-neutral-600 text-center md:text-left">
              © {currentYear} {APP_CONFIG.SITE_NAME}. All rights reserved.
            </p>
            <p className="text-sm text-neutral-600 flex items-center gap-1">
              Made with <FaHeart className="text-red-500 w-4 h-4" /> by the {APP_CONFIG.SITE_NAME} Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
