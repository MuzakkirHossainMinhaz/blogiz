import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { FiHeadphones } from "react-icons/fi";

export const metadata: Metadata = buildPageMetadata({
  title: "Support",
  description: `Get help using ${APP_CONFIG.SITE_NAME} — accounts, publishing, and common questions.`,
  path: "/support",
});

export default function SupportPage() {
  return (
    <main className="bg-paper">
      <Section className="py-12 md:py-16">
        <Container size="md">
          <div className="max-w-2xl">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 border border-primary-200 mb-6">
              <FiHeadphones className="w-7 h-7 text-primary-700" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mb-4">
              Support
            </h1>
            <p className="text-base sm:text-lg text-accent-500 mb-8 leading-relaxed">
              Quick answers for signing in, writing, and moderating on Blogiz.
            </p>

            <div className="space-y-6 text-sm sm:text-base text-accent-600 leading-relaxed">
              <div className="rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold text-ink mb-2">Sign in</h2>
                <p>
                  Use{" "}
                  <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
                    /auth/login
                  </Link>{" "}
                  with the email and password for your account. Superadmin credentials come from{" "}
                  <code className="text-ink">ADMIN_EMAIL</code> / <code className="text-ink">ADMIN_PASSWORD</code> after{" "}
                  <code className="text-ink">npm run seed</code>. Redis (<code className="text-ink">REDIS_URL</code>) must
                  be reachable or login rate limiting will block sign-in.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold text-ink mb-2">Become an author</h2>
                <p>
                  Readers open the dashboard, then Settings → role upgrade. An admin or superadmin approves the request
                  from the admin panel.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold text-ink mb-2">More help</h2>
                <p>
                  Read the project{" "}
                  <Link href={ROUTES.ABOUT} className="font-medium text-primary-600 hover:text-primary-700">
                    About
                  </Link>{" "}
                  page, or ask your instance operator. Operational setup lives in GUIDE.md for developers.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
