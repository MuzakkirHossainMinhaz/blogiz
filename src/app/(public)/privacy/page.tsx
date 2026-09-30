import { EditorialDocPage } from "@/components/shared/EditorialDocPage";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy",
  description: `How ${APP_CONFIG.SITE_NAME} handles account data, posts, reactions, and related service information.`,
  path: "/privacy",
});

const updated = "September 30, 2026";

const sections = [
  {
    id: "scope",
    title: "Who this covers",
    content: (
      <p>
        Blogiz is software that operators deploy for their own communities. This page describes the kinds of data the
        product is designed to store. Your instance operator may publish additional policies that apply on top of this
        notice.
      </p>
    ),
  },
  {
    id: "account",
    title: "Account information",
    content: (
      <>
        <p>
          When you create an account we store the email address, display name, password hash, role, approval and
          activity flags, email-verification state, and optional profile fields such as a bio. Passwords are hashed;
          Blogiz does not store raw passwords.
        </p>
        <p>
          Sessions are signed and expire after one hour. Changing sensitive account flags or rotating{" "}
          <span className="text-ink font-medium">sessionVersion</span> invalidates existing sessions.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "Posts, comments, and reactions",
    content: (
      <p>
        Published and draft posts, images you upload, comments, likes, and dislikes are stored so the editorial feed and
        dashboards can work. Moderators may review or remove content according to the instance{" "}
        <Link
          href={ROUTES.TERMS}
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          Terms
        </Link>
        .
      </p>
    ),
  },
  {
    id: "views",
    title: "Views and addresses",
    content: (
      <p>
        Blog view records may include a salted hash of a trusted-proxy client address. Raw IP addresses are not stored
        for that purpose. View rows are designed to expire after 90 days.
      </p>
    ),
  },
  {
    id: "mail-uploads",
    title: "Email, uploads, and rate limits",
    content: (
      <p>
        If the operator configures SMTP, Blogiz may send verification and password-reset mail. Image uploads may be
        hosted with Cloudinary when those credentials are set. Redis is used for rate limiting on sensitive routes such
        as sign-in.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Sharing",
    content: (
      <p>
        Blogiz does not sell personal data. Data stays with the operator of your instance and the infrastructure they
        connect (database, Redis, mail, image hosting). Public posts and approved comments are visible to anyone who can
        reach the site.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    content: (
      <p>
        You can update profile details from the dashboard settings. To delete an account or export data, contact your
        instance operator — operators with sufficient privileges can deactivate accounts and remove related user content
        according to their process.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Questions",
    content: (
      <p>
        For product context see{" "}
        <Link
          href={ROUTES.ABOUT}
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          About
        </Link>{" "}
        and{" "}
        <Link
          href={ROUTES.SUPPORT}
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          Support
        </Link>
        . For binding privacy commitments on a specific deployment, ask that deployment&apos;s operator.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <EditorialDocPage
      eyebrow="Legal"
      title="Privacy"
      description={`This notice explains what ${APP_CONFIG.SITE_NAME} stores when you use an instance, and how operators should treat that information.`}
      updated={updated}
      sections={sections}
      relatedTitle="Also see"
      relatedBlurb="Related policies and help for this Blogiz instance."
      relatedLinks={[
        { label: "Terms", href: ROUTES.TERMS },
        { label: "Support", href: ROUTES.SUPPORT },
        { label: "About Blogiz", href: ROUTES.ABOUT },
      ]}
    />
  );
}
