import Link from "next/link";
import type { ReactNode } from "react";
import { EditorialPageHero } from "@/components/shared/EditorialPageHero";

export type EditorialDocSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export type EditorialDocRelatedLink = {
  label: string;
  href: string;
};

type EditorialDocPageProps = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  sections: EditorialDocSection[];
  updated?: string;
  navLabel?: string;
  relatedTitle?: string;
  relatedBlurb?: string;
  relatedLinks?: EditorialDocRelatedLink[];
};

/** Support / Privacy / Terms: sticky aside + full-width article column. */
export function EditorialDocPage({
  eyebrow,
  title,
  description,
  sections,
  updated,
  navLabel = "On this page",
  relatedTitle = "Related",
  relatedBlurb,
  relatedLinks = [],
}: EditorialDocPageProps) {
  return (
    <main className="bg-paper">
      <EditorialPageHero eyebrow={eyebrow} title={title} description={description} />

      <section className="container-custom py-12 sm:py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 mb-4">{navLabel}</p>
              <nav aria-label={navLabel} className="flex flex-row flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-sm text-accent-500 hover:text-ink transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>

              {relatedLinks.length > 0 ? (
                <div className="mt-10 hidden lg:block border-t border-neutral-200 pt-8">
                  <p className="font-display text-lg font-semibold text-ink mb-2">{relatedTitle}</p>
                  {relatedBlurb ? (
                    <p className="text-sm text-accent-500 leading-relaxed mb-4">{relatedBlurb}</p>
                  ) : null}
                  <div className="flex flex-col gap-2 text-sm">
                    {relatedLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="font-medium text-primary-700 hover:text-primary-800"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            {updated ? <p className="text-sm text-accent-400 mb-6">Last updated {updated}</p> : null}

            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {sections.map((section) => (
                <article key={section.id} id={section.id} className="scroll-mt-28 py-8 sm:py-9">
                  <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink mb-3">
                    {section.title}
                  </h2>
                  <div className="space-y-4 text-sm sm:text-base text-accent-600 leading-relaxed">
                    {section.content}
                  </div>
                </article>
              ))}
            </div>

            {relatedLinks.length > 0 ? (
              <div className="mt-10 lg:hidden border-t border-neutral-200 pt-8">
                <p className="font-display text-lg font-semibold text-ink mb-2">{relatedTitle}</p>
                {relatedBlurb ? (
                  <p className="text-sm text-accent-500 leading-relaxed mb-4">{relatedBlurb}</p>
                ) : null}
                <div className="flex flex-wrap gap-4 text-sm">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="font-medium text-primary-700 hover:text-primary-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
