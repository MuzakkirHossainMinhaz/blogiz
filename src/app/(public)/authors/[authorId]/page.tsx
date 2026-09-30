import { Container } from "@/components/ui/Container";
import { Pagination } from "@/components/ui/Pagination";
import { Section } from "@/components/ui/Section";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ROUTES } from "@/config/constants";
import { PUBLIC_PROFILE_PAGE_LIMIT, getPublicAuthorProfile } from "@/lib/db";
import { parsePageLimit } from "@/lib/pagination";
import { buildPageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { isCloudinaryDeliveryUrl, isHttpsUrl } from "@/lib/urls";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface AuthorProfilePageProps {
  params: Promise<{
    authorId: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({ params }: AuthorProfilePageProps): Promise<Metadata> {
  const { authorId } = await params;
  const profile = await getPublicAuthorProfile(authorId, { page: 1, limit: 1, skip: 0 });
  if (!profile) {
    return buildPageMetadata({
      title: "Author not found",
      description: "This Blogiz author profile could not be found.",
      path: `/authors/${authorId}`,
      noIndex: true,
    });
  }

  const displayName = profile.profile.fullName || profile.name;
  const bio = profile.profile.bio || `Published writer on Blogiz.`;
  const image =
    profile.profile.avatar && isCloudinaryDeliveryUrl(profile.profile.avatar)
      ? profile.profile.avatar
      : undefined;

  return buildPageMetadata({
    title: displayName,
    description: bio,
    path: `/authors/${authorId}`,
    image,
    type: "profile",
  });
}

export default async function AuthorProfilePage({ params, searchParams }: AuthorProfilePageProps) {
  const { authorId } = await params;
  const { page } = await searchParams;
  const paging = parsePageLimit(page ?? null, null, PUBLIC_PROFILE_PAGE_LIMIT);
  if ("error" in paging) notFound();

  const profile = await getPublicAuthorProfile(authorId, paging);
  if (!profile) notFound();

  const displayName = profile.profile.fullName || profile.name;
  const links = [
    { href: profile.profile.website, label: "Website" },
    { href: profile.profile.socialLinks.twitter, label: "Twitter" },
    { href: profile.profile.socialLinks.linkedin, label: "LinkedIn" },
    { href: profile.profile.socialLinks.github, label: "GitHub" },
  ].filter((link) => isHttpsUrl(link.href));

  return (
    <main className="bg-paper">
      <Section className="py-8 md:py-12">
        <Container size="md">
          <header className="rounded-2xl border border-neutral-200 bg-surface shadow-soft p-6 sm:p-8 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <UserAvatar
                src={profile.profile.avatar}
                name={displayName}
                size="xl"
                priority
                className="rounded-2xl ring-primary-200 sm:w-24 sm:h-24"
              />
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight break-words">
                  {displayName}
                </h1>
                {profile.profile.location && (
                  <p className="text-sm text-accent-500 mt-1">{profile.profile.location}</p>
                )}
                <p className="mt-3 text-sm text-accent-600">
                  <span className="font-semibold text-ink">{profile.pagination.total}</span> published posts
                </p>
                {profile.profile.bio && (
                  <p className="mt-4 text-neutral-700 max-w-2xl leading-relaxed">{profile.profile.bio}</p>
                )}
                {profile.profile.expertise.length > 0 && (
                  <p className="mt-3 text-sm text-accent-500">{profile.profile.expertise.join(" · ")}</p>
                )}
                {links.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </header>

          <h2 className="font-display text-xl font-semibold text-ink mb-4">Published posts</h2>
          {profile.blogs.length === 0 ? (
            <p className="text-accent-500">No published posts yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {profile.blogs.map((blog) => (
                <li key={blog._id} className="py-5">
                  <Link
                    href={ROUTES.BLOG_DETAIL(blog._id)}
                    className="font-display text-lg sm:text-xl font-semibold text-ink hover:text-primary-600 break-words tracking-tight"
                  >
                    {blog.title}
                  </Link>
                  {blog.publish_date && (
                    <p className="text-sm text-accent-500 mt-1">{formatDate(blog.publish_date)}</p>
                  )}
                  <p className="text-neutral-600 mt-2 break-words leading-relaxed">{blog.description}</p>
                  <p className="text-sm text-accent-500 mt-3">
                    <span className="font-medium text-ink">{blog.total_likes}</span> likes
                    <span className="mx-2 text-neutral-300">·</span>
                    <span className="font-medium text-ink">{blog.total_dislikes}</span> dislikes
                  </p>
                </li>
              ))}
            </ul>
          )}
          {profile.pagination.pages > 1 && (
            <Pagination
              className="mt-6"
              page={profile.pagination.page}
              pages={profile.pagination.pages}
              total={profile.pagination.total}
              prevHref={
                profile.pagination.page > 1
                  ? profile.pagination.page === 2
                    ? ROUTES.AUTHOR(profile.id)
                    : `${ROUTES.AUTHOR(profile.id)}?page=${profile.pagination.page - 1}`
                  : undefined
              }
              nextHref={
                profile.pagination.page < profile.pagination.pages
                  ? `${ROUTES.AUTHOR(profile.id)}?page=${profile.pagination.page + 1}`
                  : undefined
              }
            />
          )}
        </Container>
      </Section>
    </main>
  );
}
