import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { APP_CONFIG } from "@/config/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { FiInfo } from "react-icons/fi";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: `Learn about ${APP_CONFIG.SITE_NAME} — an editorial home for multi-author blogs.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="bg-paper">
      <Section className="py-12 md:py-16">
        <Container size="md">
          <div className="max-w-2xl">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 border border-primary-200 mb-6">
              <FiInfo className="w-7 h-7 text-primary-700" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mb-4">
              About Blogiz
            </h1>
            <p className="text-base sm:text-lg text-accent-500 mb-8 leading-relaxed">
              Blogiz is a multi-user blog platform where readers engage with published stories and authors draft,
              publish, and grow an audience. Admins approve posts, comments, and author accounts so the public feed
              stays intentional.
            </p>

            <div className="space-y-8 text-sm sm:text-base text-neutral-700 leading-relaxed">
              <section>
                <h2 className="font-display text-xl font-semibold text-ink mb-2">What you can do</h2>
                <ul className="list-disc pl-5 space-y-2 text-accent-600">
                  <li>Read published posts and leave one like or dislike when signed in</li>
                  <li>Comment after admin approval (admins are approved immediately)</li>
                  <li>Request an author upgrade from your reader dashboard</li>
                  <li>Authors draft posts; publishing goes through review unless you are an admin</li>
                </ul>
              </section>

              <section id="privacy">
                <h2 className="font-display text-xl font-semibold text-ink mb-2">Privacy</h2>
                <p className="text-accent-600">
                  This is a placeholder privacy notice. Replace it with your operator&apos;s policy before production
                  use. Blogiz stores account profiles, posts, comments, reactions, and salted view hashes — never put
                  secrets in public metadata.
                </p>
              </section>

              <section id="terms">
                <h2 className="font-display text-xl font-semibold text-ink mb-2">Terms</h2>
                <p className="text-accent-600">
                  This is a placeholder terms section. Replace it with binding terms for your deployment. By using a
                  Blogiz instance you agree to follow the operator&apos;s content and account rules.
                </p>
              </section>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
