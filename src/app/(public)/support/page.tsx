import { EditorialDocPage } from "@/components/shared/EditorialDocPage";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildPageMetadata({
  title: "Support",
  description: `Get help using ${APP_CONFIG.SITE_NAME} — accounts, publishing, and common questions.`,
  path: "/support",
});

const sections = [
  {
    id: "sign-in",
    title: "Sign in",
    content: (
      <p>
        Open{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          Sign in
        </Link>{" "}
        with the email and password for your account. Sessions last one hour. If rate limiting is unavailable, Blogiz
        will refuse login instead of skipping protection — Redis must be reachable for sign-in to work.
      </p>
    ),
  },
  {
    id: "create-account",
    title: "Create an account",
    content: (
      <p>
        Register as a reader or author from{" "}
        <Link
          href="/auth/register"
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          Create account
        </Link>
        . New accounts verify email before uploads and other verified actions. Authors also need an admin to approve the
        account before they can sign in.
      </p>
    ),
  },
  {
    id: "become-author",
    title: "Become an author",
    content: (
      <p>
        Readers can request an upgrade from Dashboard → Settings. An admin or superadmin reviews the request. Until
        approval, you keep reading and reacting as a regular user.
      </p>
    ),
  },
  {
    id: "publish",
    title: "Drafting and publishing",
    content: (
      <p>
        Authors write from the dashboard. Asking to publish marks a post pending until someone with approval rights
        reviews it. Admins and superadmins can publish without that wait. Comments from regular users also need approval
        before they appear publicly.
      </p>
    ),
  },
  {
    id: "reactions",
    title: "Likes, dislikes, and comments",
    content: (
      <p>
        Signed-in readers leave one reaction per post — like or dislike — and may switch or remove it. Comments belong
        to published posts and follow the same moderation path as other community writing.
      </p>
    ),
  },
  {
    id: "operators",
    title: "Running your own instance",
    content: (
      <p>
        If you operate a Blogiz deployment, environment setup, seeding, and role behavior are documented in the project{" "}
        <span className="font-medium text-ink">GUIDE.md</span>. Superadmin credentials for a fresh seed come from{" "}
        <code className="text-ink text-[0.9em]">ADMIN_EMAIL</code> and{" "}
        <code className="text-ink text-[0.9em]">ADMIN_PASSWORD</code>.
      </p>
    ),
  },
];

export default function SupportPage() {
  return (
    <EditorialDocPage
      eyebrow="Help"
      title="Support"
      description={`Quick answers for signing in, writing, and moderating on ${APP_CONFIG.SITE_NAME}.`}
      sections={sections}
      relatedTitle="Still stuck?"
      relatedBlurb="Read more about how Blogiz works, or review privacy and terms for your instance."
      relatedLinks={[
        { label: "About Blogiz", href: ROUTES.ABOUT },
        { label: "Privacy", href: ROUTES.PRIVACY },
        { label: "Terms", href: ROUTES.TERMS },
      ]}
    />
  );
}
