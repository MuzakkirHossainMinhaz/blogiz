# Blogiz operations

This guide covers local services, environment variables, roles, auth, uploads, rate limits, seeding, and checks for the shipped app. Product intent and schema live in [PLAN.md](PLAN.md) and [DATABASE.md](DATABASE.md). Quick start is in [README.md](README.md).

Copy [`.env.example`](.env.example) to `.env.local` and fill only the values you need. Do not commit secrets.

## Local services

Run these before `npm run dev` or the checks:

- **MongoDB.** `MONGODB_URI` is required. The app does not fall back to localhost.
- **Redis.** `REDIS_URL` is required the first time someone registers, signs in, requests a password reset, or calls an AI route. If it is missing or Redis is down, those routes fail with a clear error (login shows that rate limiting is unavailable instead of a fake bad-password message). The same Redis also backs optional fail-open caches (public blog list/detail, author profiles, public comments, author stats/analytics, short session user snapshots, view dedupe). Those caches fall through to Mongo when Redis is down—public pages keep working. AI routes also read `AI_RATE_LIMIT_MAX_REQUESTS` / `AI_RATE_LIMIT_WINDOW_SECONDS` (defaults 3 / 60).
- **Gemini (AI Studio).** Create a free API key at [Google AI Studio](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY`. Blogiz uses `gemini-2.5-flash` for Optimize Title/Content, analyze-content, and crafting cover image prompts.
- **Pollinations for covers.** No Pollinations API key and no Cloudinary. Gemini writes the final image prompt; the app stores a Pollinations HTTPS URL on the blog with `seed={blog._id}` so the image stays stable per post.
- **Local uploads.** Manual avatars/covers are written under `var/uploads/` and served at `/api/media/{kind}/{filename}`.

A local production build also needs a reachable `MONGODB_URI` plus `AUTH_SECRET` and `AUTH_URL`. It does not call Redis or Gemini while pages are prerendered.

## Theme and fonts

The UI is light-only (`data-theme="light"`). daisyUI is installed as a Tailwind v4 CSS plugin (`@plugin "daisyui"`) with a custom light theme remapped to the logo palette: paper `#F7F6FF`, feather `#C0C8FF`, quill `#7B85F0`, ink `#3F4285`. Display type is Fraunces; UI type is Plus Jakarta Sans, both loaded with `next/font`. `package.json` sets `"browserslist": "> 1%"` so Turbopack’s Lightning CSS does not polyfill modern CSS in a way that breaks daisyUI layouts (see [daisyUI Next.js install](https://daisyui.com/docs/install/nextjs/)).

The public marketing site uses the shared Navbar and Footer. The dashboard is a separate app shell with its own top bar (logo, role context, user menu, logout) and does not render the marketing footer.

## Environment variables

| Variable                | Required                               | What it is                                                                                                                                                                                         |
| ----------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`              | Set by Next.js                         | `development`, `test`, or `production`. Leave it empty in `.env.local`. `npm run seed` refuses to run when it is `production` unless you pass `--force` / `SEED_FORCE=1` on a disposable database. |
| `MONGODB_URI`           | Always                                 | MongoDB connection string.                                                                                                                                                                         |
| `AUTH_SECRET`           | Always                                 | Secret used to sign sessions.                                                                                                                                                                      |
| `AUTH_URL`              | Always                                 | Canonical site URL, such as `http://localhost:3000` locally. Auth.js does not accept the Host header in its place. Also used for public canonical / Open Graph URLs.                               |
| `NEXTAUTH_SECRET`       | Only if `AUTH_SECRET` is unset         | Alias copied onto `AUTH_SECRET`.                                                                                                                                                                   |
| `NEXTAUTH_URL`          | Only if `AUTH_URL` is unset            | Alias copied onto `AUTH_URL`.                                                                                                                                                                      |
| `ADMIN_EMAIL`           | For `npm run seed`                     | Email of the admin to create.                                                                                                                                                                      |
| `ADMIN_PASSWORD`        | For `npm run seed`                     | Password for that account (min 10 chars, letter + number). The command does not print it.                                                                                                          |
| `SEED_FORCE`            | Optional                               | Set to `1` with `npm run seed -- --force` only on a disposable database when `NODE_ENV=production`.                                                                                                |
| `HEALTH_CHECK_SECRET`   | Only to use `/api/health`              | Shared secret. Send it as `x-health-token`. The route returns 404 until this is set and the header matches.                                                                                        |
| `GEMINI_API_KEY`                | For text AI and cover prompt craft        | Google AI Studio key. Enables Gemini `gemini-2.5-flash` for title/content polish, analysis, and crafting Pollinations cover prompts. Create at https://aistudio.google.com/apikey. |
| `AI_RATE_LIMIT_MAX_REQUESTS`    | Optional (default `3`)                    | Max AI requests per client IP (or per user when no trusted IP) inside the window. Invalid values make AI routes return 503.                  |
| `AI_RATE_LIMIT_WINDOW_SECONDS`  | Optional (default `60`)                   | Sliding-window length in seconds for `AI_RATE_LIMIT_MAX_REQUESTS`.                                                                           |
| `TRUSTED_PROXY_HEADER`          | Optional                                  | The one proxy header trusted for a client address, for example `x-real-ip`. Hashed with `AUTH_SECRET`; used for register, views, and AI limits. When unset, AI limits fall back to the signed-in user id. |
| `SMTP_HOST`             | Optional                               | SMTP host. Mail is skipped unless this and `EMAIL_FROM` are both set.                                                                                                                              |
| `EMAIL_FROM`            | With `SMTP_HOST`                       | From address for verification and password-reset mail.                                                                                                                                             |
| `SMTP_PORT`             | Optional                               | SMTP port. Defaults to 587. Port 465 uses TLS.                                                                                                                                                     |
| `SMTP_USER`             | Optional                               | SMTP username when the server requires auth.                                                                                                                                                       |
| `SMTP_PASS`             | With `SMTP_USER`                       | SMTP password.                                                                                                                                                                                     |
| `NEXT_PUBLIC_API_URL`   | Optional                               | API base used by the browser. Defaults to `/api`.                                                                                                                                                  |
| `REDIS_URL`             | For rate-limited routes                | Redis connection URL, for example `redis://127.0.0.1:6379`.                                                                                                                                        |
| `REDIS_CACHE_TTL_SECONDS` | Optional (default `45`)              | TTL for fail-open public content caches (blog list/detail, author profile, public comments). Auth/AI rate limits stay fail-closed. Session user snapshots use a fixed 30s TTL.                      |

## Roles and dashboard routes

Exactly three roles:

| Role   | Can                                                                                                                     | Cannot                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Admin  | Everything in PLAN: users (suspend, delete, reset password, change role), upgrades, site-wide blogs/comments, authoring | Demote/delete the last admin                  |
| Author | Create/draft/publish/edit/delete own blogs; moderate comments on own blogs; AI helpers; engage on others’ posts         | Manage users or other authors’ posts          |
| Reader | Comment, like/dislike published posts, edit profile, request author role                                                | Create posts or open authoring / admin routes |

Authors self-publish (`draft` → `published`). Comments are visible by default; authors (on their posts) and admins can hide or delete them. Admins can suspend commenting without banning login.

### Route matrix

| Route                                        | Reader                                   | Author                  | Admin                  |
| -------------------------------------------- | ---------------------------------------- | ----------------------- | ---------------------- |
| `/dashboard`                                 | Overview, activity, upgrade CTA          | Author overview + stats | Same + admin shortcuts |
| `/dashboard/settings`                        | Profile, password, email, author request | Profile settings        | Profile settings       |
| `/dashboard/blogs`, `/create`, `/edit/*`     | Forbidden                                | Yes                     | Yes                    |
| `/dashboard/analytics`                       | Forbidden                                | Yes                     | Yes                    |
| `/dashboard/admin`, `/dashboard/admin/users` | Forbidden                                | Forbidden               | Yes                    |

## Seeding

Fixtures live under `scripts/seed-data/`.

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-long-password1' npm run seed
```

`npm run seed`:

1. Refuses when `NODE_ENV=production` unless `--force` or `SEED_FORCE=1` (disposable DBs only).
2. Truncates users, blogs, comments, reactions, blog views, role-upgrade requests, media assets, and moderation actions, then syncs indexes.
3. Seeds an `admin` from env, sample authors/readers, draft + published blogs, nested comments, reactions, views, and one pending reader→author upgrade.
4. Verifies the admin password hash and `canSignIn` (`isActive`) before exiting.

After seed, sign in at `/auth/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Redis must be running.

## Auth

Sign in at `/auth/login` with email and password. Sessions last one hour. Each request reloads the user and drops the session if the account is inactive or `sessionVersion` has changed.

Passwords are at least 10 characters and include a letter and a number. Registration always creates a `reader`. New accounts must verify email before uploads and other verified actions. Inactive accounts cannot sign in. `emailVerified` is not required for login.

A wrong password and a login rate-limit block both return “Invalid email or password”. If Redis is missing or down, login reports that rate limiting is unavailable instead of signing the user in.

Verification and reset mail go out only when SMTP is configured. Without SMTP, those links are not sent. Admins can also reset a user’s password from the admin users UI.

## Public SEO

Public pages set title, description, Open Graph, canonical URL (from `AUTH_URL`), and robots. Blog detail and author profile metadata are generated from published data. Do not put secrets or private emails into meta tags.

## Uploads

`POST /api/upload` stores a JPEG, PNG, or WebP for a verified signed-in user. The server ignores the client filename, checks magic bytes, and rejects anything over 5 MB.

Bytes are written under `var/uploads/{kind}/` (`avatars`, `covers`, `banners`, or `general`). The database stores a same-origin `/api/media/{kind}/{filename}` path. Blog thumbnail fields also accept Pollinations HTTPS URLs from AI generate.

`POST /api/ai/generate-image` requires `blogId` (MongoDB `_id`) and `title` (plus optional `description` / `summary`, `content` excerpt, and `prompt` as creative direction). On create, the editor save-then-generates a draft first when no id exists yet; without `blogId` the route returns 400. Gemini crafts a vivid 1200×630 image prompt (style, mood, lighting; no text/logos); the response URL is `https://pollinations.ai/p/{encoded_prompt}?width=1200&height=630&seed={blogId}` and is saved **directly** on the blog thumbnail field (no fetch/re-upload). Returns `{ url, prompt }` where `prompt` is the Gemini-crafted string—never a raw title. Needs `GEMINI_API_KEY`, a verified signed-in owner (or admin), and Redis (one AI rate-limit hit per Generate). Failures return a specific error instead of a generic 500.

`POST /api/ai/optimize` polishes title or content (voice-preserving) for authors via Gemini `gemini-2.5-flash`; returns `{ optimized }` for the editor to apply. Requires `GEMINI_API_KEY` and Redis. Missing key, Redis, and provider errors surface as clear JSON `{ error, message }` responses. AI routes share `AI_RATE_LIMIT_MAX_REQUESTS` × `AI_RATE_LIMIT_WINDOW_SECONDS` (default 3 / 60s); a 429 message asks the client to try again in a minute.

Blog bodies are Markdown in the editor (preview + public post view share `renderContent`). Tailwind Preflight resets headings/lists, so `.prose` in `globals.css` supplies typography for headings, lists, links, code, quotes, and emphasis.

Profile avatars are uploaded from Settings (`kind=avatars` → `/api/media/avatars/...`).

Replacing or clearing a local upload deletes the previous file on disk when possible. Pollinations cover URLs are external and are not deleted remotely.

## Author analytics API

`GET /api/blogs/analytics` (authors and admins) returns summary counts for the signed-in author’s own posts, a draft vs published mix, top published posts by likes, and weekly engagement series (views from `BlogView`, likes from `Reaction`, comments from `Comment`) for the last 12 weeks. Aggregation `$match` on `authorId` uses ObjectId casting. Readers receive 403.

## Rate limits and Redis caching

Auth and AI routes use Redis sliding windows. Missing Redis fails closed with a clear error. Content caches fail open (Mongo remains authoritative).

| Use | Keys (prefix) | Fail mode | Notes |
| --- | --- | --- | --- |
| Auth rate limits (login / register / password reset) | `blogiz:login:…`, `blogiz:register:…`, `blogiz:reset:…` | **Fail closed** | 503 / clear login error when Redis is down |
| AI rate limits | `blogiz:ai-…` via `AI_RATE_LIMIT_*` | **Fail closed** | Same as auth |
| Reaction counts / per-user reaction | `blogiz:reaction:…` | Fail open | Mongo is source of truth |
| View dedupe (1 hour) | `blogiz:viewdedupe:{blogId}:{userId\|sessionId}` | Fail open | `SET NX EX 3600`; on Redis miss, keep Mongo `BlogView` dedupe |
| Public blog list / detail | `blogiz:cache:blogs:list:…`, `blogiz:cache:blog:{id}` | Fail open | Published payloads only; TTL `REDIS_CACHE_TTL_SECONDS` (default 45) |
| Public author profile | `blogiz:cache:author:{id}:p{page}:l{limit}` | Fail open | Invalidated on profile update and author publish/edit/delete |
| Public comments (visible only) | `blogiz:cache:comments:{blogId}:…` | Fail open | Never cached when moderators see hidden comments |
| Author stats / analytics | `blogiz:cache:stats:{userId}`, `blogiz:cache:analytics:{userId}` | Fail open | ~90s TTL; invalidated on that author’s blog/comment mutations |
| Session user snapshot | `blogiz:cache:user:{id}:sess` | Fail open | 30s TTL; busted on `sessionVersion` bumps / suspend / verify |

Invalidate on publish, unpublish, edit, delete, profile updates, comment create/hide/delete, and any `sessionVersion` bump. Never cache drafts, moderator-hidden comment lists, or admin lists without identity in the key.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

Vitest covers authz, reactions, seed pipeline, rate limits, redis-cache / view-dedupe helpers, and security helpers.

## Related docs

- [PLAN.md](PLAN.md) — Product and engineering plan
- [DATABASE.md](DATABASE.md) — Schema design
- [README.md](README.md) — Overview and quick start
