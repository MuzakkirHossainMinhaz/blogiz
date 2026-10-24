# Blogiz — Product & Engineering Plan

## Vision / Overview

Blogiz is a multi-role blogging platform where readers discover and engage with posts, authors draft and publish writing with optional AI assistance, and admins govern users, content, and trust. The product is a complete Next.js application with TypeScript, server-side MongoDB access via Mongoose, and a clear separation of capabilities across exactly three roles: **Admin**, **Author**, and **Reader**.

The writing experience should feel author-led. AI is an on-demand helper for thumbnails and light polish (spelling, grammar, SEO), never a silent rewrite of the author’s voice.

---

## Goals

1. **Role-clear product** — Every signed-in user is Admin, Author, or Reader; permissions are explicit and enforceable on the server.
2. **Full authoring loop** — Authors can create, draft, publish, update, and delete their own blogs, and moderate comments on those blogs.
3. **Healthy engagement** — Readers can read published blogs, react, comment, and reply; they can request to become authors.
4. **Trust & moderation** — Admins manage users (including suspensions and password resets), approve or reject reader→author requests, and manage blogs/comments site-wide. Admins can also publish as authors.
5. **AI as assistive, not authoritative** — Thumbnail generation and title/content optimization are opt-in actions that preserve voice and only touch the fields the author chooses.
6. **Solid account basics** — All roles can update basic profile info, change password, and update avatar/profile picture.

---

## Tech stack

| Layer         | Choice                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Framework     | Next.js (App Router), React                                            |
| Language      | TypeScript                                                             |
| Database      | MongoDB with Mongoose (server-side only)                               |
| Auth          | Session-based email/password (e.g. Auth.js / NextAuth)                 |
| Media         | Local `/api/media` uploads for avatars/manual covers; Pollinations HTTPS URL strings for AI covers |
| AI            | Gemini (`gemini-2.5-flash`) for text + cover prompt craft; Pollinations URL + `_id` seed in Mongo; Redis env rate limits |
| Rate limiting | Redis (auth and AI routes)                                             |
| UI            | Tailwind CSS + component layer; accessible light theme                 |

Server routes and server components own all MongoDB access. Secrets (DB URI, auth secret, Gemini API key, Redis URL) stay in environment configuration.

Schema details live in [DATABASE.md](DATABASE.md).

---

## Roles & permissions

Exactly three roles. Enum values in the data model:

| Product role | Stored `role` value | Notes                                 |
| ------------ | ------------------- | ------------------------------------- |
| Admin        | `admin`             | Full moderation + can author content  |
| Author       | `author`            | Own blogs and comments on those blogs |
| Reader       | `reader`            | Default for new public accounts       |

### **Capability summary**

| Capability                                             | Reader | Author | Admin         |
| ------------------------------------------------------ | ------ | ------ | ------------- |
| Update profile / password / avatar                     | ✓      | ✓      | ✓             |
| Read published blogs                                   | ✓      | ✓      | ✓             |
| React, comment, reply                                  | ✓\*    | ✓\*    | ✓\*           |
| Request author role                                    | ✓      | —      | —             |
| Create / draft / publish / edit / delete **own** blogs | —      | ✓      | ✓ (as author) |
| Manage comments on **own** blogs                       | —      | ✓      | ✓             |
| Manage any user, blog, or comment                      | —      | —      | ✓             |
| Approve / reject reader→author requests                | —      | —      | ✓             |
| Suspend accounts / comment privileges; reset passwords | —      | —      | ✓             |

\* Subject to account status and comment-suspension flags.

Authorization is enforced in API handlers and server actions, not only in the UI. An Admin who authors content uses the same blog ownership rules as Authors (owns posts they create) while retaining site-wide admin tools.

---

## Features by role

### All roles

- Edit basic profile fields (display name, bio, optional links/location as product allows).
- Change password (current password + new password, with strength rules).
- Upload or replace profile picture / avatar; previous local uploads are deleted from disk when replaced.

### Reader

- Browse and read **published** blogs.
- React to a blog (e.g. like / dislike — one reaction per user per blog).
- Comment on published blogs and reply to existing comments (threaded via parent reference).
- Submit a **role-upgrade request** to become an Author (reason text, pending until Admin decides).
- Dashboard focused on activity and the author-request flow.

### Author

- Create blogs; save as **draft** (unpublished) and **publish** later.
- Update and delete their own blogs (drafts and published, per product rules).
- Manage comments on blogs they own (hide/remove/approve as designed).
- Use AI helpers on their own drafts/posts (thumbnail, title optimize, content optimize).
- Same engagement features as Reader on others’ published posts.
- Authoring dashboard: list, create, edit, and basic stats for own content.

### Admin

- **Users:** list/search; delete or deactivate/suspend; reset password; change role when appropriate; review reader→author requests (approve → promote to `author`; reject with optional reason).
- **Commenting suspensions:** suspend a user from commenting (abuse / uncertainty) without necessarily banning login or reading.
- **Blogs & comments:** moderate any blog or comment (unpublish, delete, restore policy as implemented).
- **Author capabilities:** Admin can create and manage blogs as an author (draft, publish, AI helpers, own-comment management).
- Admin dashboard for queues (pending upgrades, flagged content) and user management.

---

## Blog & AI workflows

### Blog lifecycle

1. Author (or Admin-as-author) creates a post with title, content, optional description/tags, optional thumbnail.
2. Status starts as **`draft`** (not public).
3. Author publishes when ready → status **`published`**, visible to readers.
4. Author may return a published post to draft or edit in place (product choice: edit-in-place vs unpublish-first; recommend unpublish or draft for major rewrites).
5. Author can delete own posts; Admin can delete or force-unpublish any post.

Counters (likes, dislikes, comments, views) are denormalized on the blog document for list/card performance, with source-of-truth collections for reactions and comments.

### AI: thumbnail generation

- Trigger: explicit **Generate thumbnail** action.
- Input: title (required), optional description/content excerpt; optional creative-direction prompt (not the final image string).
- Pipeline: Gemini crafts a vivid image prompt → Pollinations URL with `seed={blog._id}` stored directly on the blog (no Pollinations API key, no Cloudinary).
- `blogId` is required (edit flow, or save-then-generate on create) so the seed stays stable.
- Output: Pollinations HTTPS URL plus the Gemini-crafted `prompt`; author can regenerate or replace with an upload.
- Server-side only; env-driven Redis AI rate limits apply (`AI_RATE_LIMIT_*`); one hit per Generate.

### AI: title & content optimization

- Separate buttons: **Optimize title** and **Optimize content** (run independently).
- Provider: Google Gemini (`gemini-2.5-flash`) with `GEMINI_API_KEY` from AI Studio.
- Scope: only the chosen field(s); author reviews and accepts before overwrite (or applies into the editor as a suggestion).
- Behavior: **not a full rewrite**. Preserve the writer’s voice. Allowed changes: spelling, grammar, light clarity, and SEO polish (e.g. keyword phrasing, length for titles) without changing meaning or style.
- Disabled or degraded gracefully when `GEMINI_API_KEY` is unset; AI routes share Redis IP/user rate limits from env.

---

## Auth & account

- Email + password registration and sign-in.
- New accounts default to role **`reader`**.
- Email verification recommended before sensitive actions (uploads, AI) when SMTP is configured.
- Password reset via email token when SMTP is available; Admin can also reset/force password change for support cases.
- Sessions invalidated on password change, deactivation, or admin-driven session bump (`sessionVersion` or equivalent).
- Inactive / suspended accounts cannot use privileged actions; comment-suspended users can still read and (if Author/Admin) may still manage blogs depending on policy — commenting is blocked.

---

## Admin capabilities

| Area           | Actions                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Users          | View, search, deactivate/suspend, delete (soft or hard per policy), reset password, adjust role |
| Role upgrades  | Approve or reject pending `reader` → `author` requests                                          |
| Commenting     | Suspend / unsuspend commenting for a user; moderate individual comments                         |
| Blogs          | Unpublish, delete, or edit any blog when needed for policy                                      |
| Self as author | Full authoring toolkit on blogs they create                                                     |

Admin tools should leave an audit trail where practical (who approved a request, when a user was suspended) — at minimum timestamps and reviewer refs on upgrade requests and suspension records.

---

## Non-goals / later phases

Out of scope for the initial product plan (unless already trivial):

- OAuth / social login (email-password first).
- Multi-tenant organizations or teams.
- Paid subscriptions or paywalled posts.
- Full automated content moderation pipeline (manual Admin tools first).
- Real-time collaborative editing.
- Mobile native apps (responsive web is enough).
- Roles beyond Admin / Author / Reader (no superadmin tier in this plan).

Nice-to-have later: richer analytics, bookmarks, email digests, public author follow graph, banner/CMS marketing surfaces.

---

## Suggested delivery phases

### Phase 1 — Foundation

- Next.js + TypeScript project skeleton, MongoDB/Mongoose connection, env config.
- User model with `admin` | `author` | `reader`; auth (register, login, session, password change/reset).
- Profile update + avatar upload.

### Phase 2 — Blogging & engagement

- Blog CRUD with draft / published.
- Public blog listing and detail.
- Comments + replies; reactions (unique per user/blog).
- Author dashboard for own posts and comment management.

### Phase 3 — Admin & trust

- Admin user management (suspend, delete, reset password).
- Role-upgrade request queue (reader → author).
- Comment-suspension flag and enforcement.
- Site-wide blog/comment moderation.

### Phase 4 — AI assists

- Thumbnail generation from title/content.
- On-demand title optimize and content optimize (voice-preserving polish).
- Quotas, rate limits, and feature flags when keys are missing.

### Phase 5 — Harden & polish

- Seed data and operational guide; rate limits on auth/AI; SEO for public posts; accessibility and performance pass; tests for authz and core workflows.

---

## Related docs

- [DATABASE.md](DATABASE.md) — MongoDB / Mongoose collections, fields, indexes, and relationships
- [README.md](README.md) — Project overview and quick start
- [GUIDE.md](GUIDE.md) — Operations and environment details
