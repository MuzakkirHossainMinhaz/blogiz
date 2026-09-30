import { seedImageUrl } from "./images.mjs";

/** Static seed fixtures (emails/passwords for non-admin users are set in the seeder). */
export function buildSeedUsers(adminEmail) {
  return {
    admin: {
      email: adminEmail,
      name: "Super Admin",
      role: "superadmin",
      profile: {
        fullName: "Super Administrator",
        bio: "Platform superadmin with full access.",
        location: "Remote",
        expertise: ["operations", "moderation"],
        avatar: seedImageUrl("blogiz/avatars/superadmin"),
      },
    },
    siteAdmin: {
      email: "admin@blogiz.test",
      password: "AdminPass1234",
      name: "Casey Admin",
      role: "admin",
      profile: {
        fullName: "Casey Admin",
        bio: "Moderates posts and comments.",
        location: "Austin, TX",
        expertise: ["moderation"],
        avatar: seedImageUrl("blogiz/avatars/admin"),
      },
    },
    authors: [
      {
        email: "ava.writer@blogiz.test",
        password: "AuthorPass123",
        name: "Ava Writer",
        role: "author",
        profile: {
          fullName: "Ava Writer",
          bio: "Writes about craft, calm product design, and indie publishing.",
          location: "Portland, OR",
          website: "https://example.com/ava",
          expertise: ["design", "writing"],
          avatar: seedImageUrl("blogiz/avatars/ava"),
          socialLinks: { twitter: "https://example.com/x/ava", github: "https://example.com/gh/ava" },
        },
      },
      {
        email: "noah.ink@blogiz.test",
        password: "AuthorPass123",
        name: "Noah Ink",
        role: "author",
        profile: {
          fullName: "Noah Ink",
          bio: "Essays on engineering culture and long-form notes.",
          location: "Toronto, ON",
          expertise: ["engineering", "culture"],
          avatar: seedImageUrl("blogiz/avatars/noah"),
        },
      },
    ],
    readers: [
      {
        email: "reader.one@blogiz.test",
        password: "ReaderPass123",
        name: "Riley Reader",
        role: "user",
        profile: {
          fullName: "Riley Reader",
          bio: "Here for the stories.",
          avatar: seedImageUrl("blogiz/avatars/riley"),
        },
      },
      {
        email: "reader.two@blogiz.test",
        password: "ReaderPass123",
        name: "Sam Subscriber",
        role: "user",
        profile: {
          fullName: "Sam Subscriber",
          bio: "Comments and likes thoughtfully.",
          avatar: seedImageUrl("blogiz/avatars/sam"),
        },
      },
    ],
    pendingAuthor: {
      email: "pending.author@blogiz.test",
      password: "AuthorPass123",
      name: "Pat Pending",
      role: "author",
      isApproved: false,
      profile: {
        fullName: "Pat Pending",
        bio: "Waiting on author approval — cannot sign in until approved.",
        avatar: seedImageUrl("blogiz/avatars/pending"),
      },
    },
  };
}

export const blogFixtures = [
  {
    key: "indigo-craft",
    authorEmail: "ava.writer@blogiz.test",
    title: "Indigo craft: designing a calm editorial home",
    description: "How Blogiz leans on paper, feather, quill, and ink without shouting for attention.",
    content:
      "<p>Great reading experiences feel quiet. This post walks through palette choices, type pairing with Fraunces and Plus Jakarta Sans, and why the public site should never pretend to be the dashboard.</p><p>Keep motion minimal. Let empty states breathe. Prefer one job per section.</p>",
    tags: ["design", "product"],
    status: "published",
    isApproved: true,
    blog_image: seedImageUrl("blogiz/posts/indigo-craft"),
    readingTime: 6,
  },
  {
    key: "multi-author",
    authorEmail: "noah.ink@blogiz.test",
    title: "Running a multi-author blog without chaos",
    description: "Approval queues, role upgrades, and what readers actually need in a dashboard.",
    content:
      "<p>Authors draft. Admins approve. Readers engage. Keep those lanes clear in navigation and APIs.</p><p>Role upgrades should be explicit requests — never silent promotions.</p>",
    tags: ["community", "ops"],
    status: "published",
    isApproved: true,
    blog_image: seedImageUrl("blogiz/posts/multi-author"),
    readingTime: 5,
  },
  {
    key: "draft-notes",
    authorEmail: "ava.writer@blogiz.test",
    title: "Draft: notes on empty states",
    description: "Work in progress — not public yet.",
    content: "<p>Empty states should explain the next action, not apologize forever.</p>",
    tags: ["draft"],
    status: "draft",
    isApproved: false,
    blog_image: seedImageUrl("blogiz/posts/draft-notes"),
    readingTime: 3,
  },
  {
    key: "pending-review",
    authorEmail: "noah.ink@blogiz.test",
    title: "Pending: a post waiting for review",
    description: "Submitted for admin approval.",
    content: "<p>This post is pending. Admins should see it in the review queue.</p>",
    tags: ["review"],
    status: "pending",
    isApproved: false,
    blog_image: seedImageUrl("blogiz/posts/pending-review"),
    readingTime: 4,
  },
];

export const bannerFixtures = [
  {
    title: "Welcome to Blogiz",
    subtitle: "Stories worth putting to paper",
    description: "Read the latest from our authors.",
    image: seedImageUrl("blogiz/banners/welcome"),
    ctaText: "Browse blogs",
    ctaLink: "/blogs",
    type: "hero",
    targetAudience: "all",
    order: 0,
    isActive: true,
  },
  {
    title: "Write with Blogiz",
    subtitle: "Authors welcome",
    description: "Request an upgrade from your reader dashboard.",
    image: seedImageUrl("blogiz/banners/write"),
    ctaText: "Open dashboard",
    ctaLink: "/dashboard",
    type: "featured",
    targetAudience: "users",
    order: 1,
    isActive: true,
  },
];

export const commentFixtures = [
  {
    blogKey: "indigo-craft",
    authorEmail: "reader.one@blogiz.test",
    content: "The palette guidance is exactly what I needed for our redesign.",
    isApproved: true,
  },
  {
    blogKey: "indigo-craft",
    authorEmail: "reader.two@blogiz.test",
    content: "Love the emphasis on empty states.",
    isApproved: true,
  },
  {
    blogKey: "multi-author",
    authorEmail: "reader.one@blogiz.test",
    content: "Waiting on approval — should stay hidden until an admin reviews.",
    isApproved: false,
  },
];
