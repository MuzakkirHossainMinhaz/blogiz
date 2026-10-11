/** Static seed fixtures (emails/passwords for non-admin users are set in the seeder).
 * Avatars/thumbnails stay empty so the UI uses local fallbacks until real Cloudinary uploads exist.
 */
export function buildSeedUsers(adminEmail) {
  return {
    admin: {
      email: adminEmail,
      name: "Platform Admin",
      role: "admin",
      profile: {
        fullName: "Platform Administrator",
        bio: "Site admin with full moderation access.",
        location: "Remote",
        expertise: ["operations", "moderation"],
        avatar: "",
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
          avatar: "",
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
          avatar: "",
        },
      },
    ],
    readers: [
      {
        email: "reader.one@blogiz.test",
        password: "ReaderPass123",
        name: "Riley Reader",
        role: "reader",
        profile: {
          fullName: "Riley Reader",
          bio: "Here for the stories.",
          avatar: "",
        },
      },
      {
        email: "reader.two@blogiz.test",
        password: "ReaderPass123",
        name: "Sam Subscriber",
        role: "reader",
        profile: {
          fullName: "Sam Subscriber",
          bio: "Comments and likes thoughtfully.",
          avatar: "",
        },
      },
    ],
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
    thumbnail: "",
    thumbnailSource: "none",
    readingTime: 6,
  },
  {
    key: "multi-author",
    authorEmail: "noah.ink@blogiz.test",
    title: "Running a multi-author blog without chaos",
    description: "Drafts, publishing, role upgrades, and what readers actually need in a dashboard.",
    content:
      "<p>Authors draft and publish. Admins govern trust. Readers engage. Keep those lanes clear in navigation and APIs.</p><p>Role upgrades should be explicit requests — never silent promotions.</p>",
    tags: ["community", "ops"],
    status: "published",
    thumbnail: "",
    thumbnailSource: "none",
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
    thumbnail: "",
    thumbnailSource: "none",
    readingTime: 3,
  },
];

export const commentFixtures = [
  {
    blogKey: "indigo-craft",
    authorEmail: "reader.one@blogiz.test",
    content: "The palette guidance is exactly what I needed for our redesign.",
    isVisible: true,
  },
  {
    blogKey: "indigo-craft",
    authorEmail: "reader.two@blogiz.test",
    content: "Love the emphasis on empty states.",
    isVisible: true,
    replyToIndex: 0,
  },
  {
    blogKey: "multi-author",
    authorEmail: "reader.one@blogiz.test",
    content: "Clear lanes for readers, authors, and admins — this matches how I work.",
    isVisible: true,
  },
];
