import { EditorialDocPage } from "@/components/shared/EditorialDocPage";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms",
  description: `Terms of use for ${APP_CONFIG.SITE_NAME} — accounts, content, moderation, and acceptable use.`,
  path: "/terms",
});

const updated = "September 30, 2026";

const sections = [
  {
    id: "agreement",
    title: "Agreement",
    content: (
      <p>
        These terms govern access to Blogiz software as deployed by an operator. If you do not agree, do not create an
        account or continue using the service. Operators may add local policies; where those conflict with this document
        for a given deployment, the operator&apos;s posted rules control for that instance.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    content: (
      <p>
        You are responsible for the credentials you use and for activity under your account. Keep passwords private.
        Operators may deactivate accounts that appear compromised, abusive, or inactive. Authors must remain approved to
        sign in; inactive accounts cannot sign in.
      </p>
    ),
  },
  {
    id: "content",
    title: "Your content",
    content: (
      <p>
        You retain ownership of the writing and images you submit. By publishing on Blogiz you grant the operator a
        non-exclusive license to host, display, moderate, and distribute that content within the service. You confirm
        you have the rights needed to post what you submit.
      </p>
    ),
  },
  {
    id: "moderation",
    title: "Moderation",
    content: (
      <p>
        Blogiz is designed for reviewed publishing. Posts and comments may stay pending until an admin approves them.
        Operators and admins may reject, hide, or delete content that violates these terms or local house rules,
        including spam, harassment, illegal material, or misleading impersonation.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Attempt to bypass authentication, rate limits, or role checks</li>
          <li>Probe, scrape, or overload the service in ways that harm other users</li>
          <li>Upload malware or use the platform to distribute harmful software</li>
          <li>Post content you do not have rights to share</li>
          <li>Use another person&apos;s account without permission</li>
        </ul>
      </>
    ),
  },
  {
    id: "reactions",
    title: "Reactions and community features",
    content: (
      <p>
        Likes and dislikes are limited to one reaction per signed-in user per post. They exist to signal reading
        preference, not to harass authors. Abuse of reactions or comment threads may lead to moderation action.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    content: (
      <p>
        Blogiz is provided as-is for the instance you use. Features may change as the software evolves. Operators may
        suspend service for maintenance or safety. We do not promise uninterrupted access or that every draft will be
        published.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <p>
        To the fullest extent allowed by law, operators and contributors are not liable for indirect, incidental, or
        consequential damages arising from use of the service, including lost writing that was not backed up elsewhere.
        Keep local copies of important drafts.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Questions",
    content: (
      <p>
        Product help lives on{" "}
        <Link
          href={ROUTES.SUPPORT}
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          Support
        </Link>
        . Privacy practices are described in{" "}
        <Link
          href={ROUTES.PRIVACY}
          className="font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline"
        >
          Privacy
        </Link>
        . For account-specific disputes on a deployment, contact that instance&apos;s operator.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <EditorialDocPage
      eyebrow="Legal"
      title="Terms"
      description={`By using ${APP_CONFIG.SITE_NAME} you agree to these terms and to any additional rules published by the operator of the instance you visit.`}
      updated={updated}
      sections={sections}
      relatedTitle="Also see"
      relatedBlurb="Related policies and help for this Blogiz instance."
      relatedLinks={[
        { label: "Privacy", href: ROUTES.PRIVACY },
        { label: "Support", href: ROUTES.SUPPORT },
        { label: "About Blogiz", href: ROUTES.ABOUT },
      ]}
    />
  );
}
