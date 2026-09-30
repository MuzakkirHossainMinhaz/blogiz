import { EditorialDocPage } from "@/components/shared/EditorialDocPage";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: `Learn about ${APP_CONFIG.SITE_NAME} — an editorial home for multi-author blogs.`,
  path: "/about",
});

const pillars = [
  {
    title: "Write with intention",
    body: "Authors draft on paper-quiet tools, then publish through review so the public feed stays curated rather than noisy.",
  },
  {
    title: "Read without clutter",
    body: "Stories arrive as finished pieces — clear titles, calm typography, and room to react with a single like or dislike.",
  },
  {
    title: "Moderate with care",
    body: "Admins approve authors, posts, and comments. The feed stays intentional because someone is accountable for it.",
  },
];

const roles = [
  {
    name: "Readers",
    detail:
      "Browse published posts, leave a reaction, comment after approval, and request an author upgrade from the dashboard.",
  },
  {
    name: "Authors",
    detail:
      "Draft and edit their own posts. Publishing goes through review unless the account already has admin privileges.",
  },
  {
    name: "Admins",
    detail:
      "Approve posts, comments, and author accounts, manage banners, and keep the public surface coherent.",
  },
];

const sections = [
  {
    id: "why",
    title: "Why Blogiz exists",
    content: (
      <>
        <p>
          Most blogging tools optimize for speed and volume. Blogiz leans the other way: draft carefully, publish through
          review, and share work that holds up next to other authors on the same shelf.
        </p>
        <p>
          Readers engage with published stories. Authors grow an audience without fighting algorithmic noise. Operators
          keep the room tidy through clear roles and approvals.
        </p>
      </>
    ),
  },
  {
    id: "craft",
    title: "How the craft comes together",
    content: (
      <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="min-w-0">
            <h3 className="font-display text-base font-semibold text-ink mb-2">{pillar.title}</h3>
            <p className="text-sm sm:text-base text-accent-500 leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "roles",
    title: "Who uses Blogiz",
    content: (
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        {roles.map((role) => (
          <li key={role.name} className="py-5 sm:py-6 grid gap-2 sm:grid-cols-12 sm:gap-6 first:pt-0 last:pb-0">
            <p className="sm:col-span-3 font-display text-base font-semibold text-ink">{role.name}</p>
            <p className="sm:col-span-9 text-sm sm:text-base text-accent-500 leading-relaxed">{role.detail}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "start",
    title: "Getting started",
    content: (
      <>
        <p>
          Create an account, explore published stories, or open Support for sign-in tips and author upgrades. Privacy and
          Terms describe how this instance handles data and community rules.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={ROUTES.SUPPORT}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
          >
            Visit support
          </Link>
          <Link
            href={ROUTES.BLOGS}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-ink bg-surface border border-primary-200 hover:border-primary-300 transition-colors"
          >
            Browse blogs
          </Link>
        </div>
      </>
    ),
  },
];

export default function AboutPage() {
  return (
    <EditorialDocPage
      eyebrow={APP_CONFIG.SITE_NAME}
      title="An editorial home for multi-author blogs"
      description="Blogiz is built for writers who want a calm place to publish and readers who want stories worth the time — not a feed that shouts."
      sections={sections}
      relatedTitle="Explore next"
      relatedBlurb="Jump to help, policies, or the public feed."
      relatedLinks={[
        { label: "Support", href: ROUTES.SUPPORT },
        { label: "Privacy", href: ROUTES.PRIVACY },
        { label: "Terms", href: ROUTES.TERMS },
        { label: "Blogs", href: ROUTES.BLOGS },
      ]}
    />
  );
}
