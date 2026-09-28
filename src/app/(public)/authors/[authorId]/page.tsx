import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/config/constants";
import { PUBLIC_PROFILE_PAGE_LIMIT, getPublicAuthorProfile } from "@/lib/db";
import { parsePageLimit } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { isCloudinaryDeliveryUrl, isHttpsUrl } from "@/lib/urls";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface AuthorProfilePageProps {
  params: Promise<{
    authorId: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center text-3xl font-display font-semibold overflow-hidden shrink-0 border border-primary-200">
                {profile.profile.avatar && isCloudinaryDeliveryUrl(profile.profile.avatar) ? (
                  <Image
                    src={profile.profile.avatar}
                    alt=""
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
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
            <nav className="mt-6 flex items-center justify-between gap-3 text-sm">
              {profile.pagination.page > 1 ? (
                <Link
                  href={`${ROUTES.AUTHOR(profile.id)}?page=${profile.pagination.page - 1}`}
                  className="inline-flex items-center min-h-11 font-medium text-primary-600 hover:text-primary-700"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              {profile.pagination.page < profile.pagination.pages ? (
                <Link
                  href={`${ROUTES.AUTHOR(profile.id)}?page=${profile.pagination.page + 1}`}
                  className="inline-flex items-center min-h-11 font-medium text-primary-600 hover:text-primary-700"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </Container>
      </Section>
    </main>
  );
}
