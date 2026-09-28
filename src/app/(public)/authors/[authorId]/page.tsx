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
    <main className="bg-white">
      <Section className="py-8 md:py-12">
        <Container size="md">
          <header className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-semibold overflow-hidden">
              {profile.profile.avatar && isCloudinaryDeliveryUrl(profile.profile.avatar) ? (
                <Image src={profile.profile.avatar} alt="" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">{displayName}</h1>
              {profile.profile.location && <p className="text-sm text-neutral-500 mt-1">{profile.profile.location}</p>}
              {profile.profile.bio && <p className="mt-3 text-neutral-700 max-w-2xl">{profile.profile.bio}</p>}
              {profile.profile.expertise.length > 0 && (
                <p className="mt-2 text-sm text-neutral-600">{profile.profile.expertise.join(", ")}</p>
              )}
              {links.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-3">
                  {links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-sm font-medium text-primary-600 hover:text-primary-700" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </header>

          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Published posts</h2>
          {profile.blogs.length === 0 ? (
            <p className="text-neutral-600">No published posts yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {profile.blogs.map((blog) => (
                <li key={blog._id} className="py-5">
                  <Link href={ROUTES.BLOG_DETAIL(blog._id)} className="text-lg font-semibold text-neutral-900 hover:text-primary-600">
                    {blog.title}
                  </Link>
                  {blog.publish_date && <p className="text-sm text-neutral-500 mt-1">{formatDate(blog.publish_date)}</p>}
                  <p className="text-neutral-600 mt-2">{blog.description}</p>
                  <p className="text-sm text-neutral-700 mt-3">
                    <span className="font-medium">{blog.total_likes}</span> likes
                    <span className="mx-2 text-neutral-300">·</span>
                    <span className="font-medium">{blog.total_dislikes}</span> dislikes
                  </p>
                </li>
              ))}
            </ul>
          )}
          {profile.pagination.pages > 1 && (
            <nav className="mt-6 flex items-center justify-between text-sm">
              {profile.pagination.page > 1 ? (
                <Link
                  href={`${ROUTES.AUTHOR(profile.id)}?page=${profile.pagination.page - 1}`}
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              {profile.pagination.page < profile.pagination.pages ? (
                <Link
                  href={`${ROUTES.AUTHOR(profile.id)}?page=${profile.pagination.page + 1}`}
                  className="font-medium text-primary-600 hover:text-primary-700"
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
