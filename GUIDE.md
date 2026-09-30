# Blogiz operations

This guide covers local services, environment variables, roles, auth, uploads, rate limits, seeding, and checks. What the app is, and the short start path, are in [README.md](README.md). Copy [`.env.example`](.env.example) to `.env.local` and fill only the values you need. Do not commit secrets.

## Local services

Run these before `npm run dev` or the checks:

- **MongoDB.** `MONGODB_URI` is required. The app does not fall back to localhost.
- **Redis.** `REDIS_URL` is required the first time someone registers, signs in, requests a password reset, or calls an AI route. If it is missing or Redis is down, those routes fail with a clear error (login shows that rate limiting is unavailable instead of a fake bad-password message).
- **Cloudinary.** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are required to upload or delete an image. The API secret stays on the server. Seed data uses Cloudinary-shaped HTTPS URLs for the configured cloud name (or `demo` when unset) so public cards and banners can render.

A local production build also needs a reachable `MONGODB_URI` plus `AUTH_SECRET` and `AUTH_URL`. It does not call Redis or Cloudinary while pages are prerendered.

## Theme and fonts

The UI is light-only (`data-theme="light"`). daisyUI is installed as a Tailwind v4 CSS plugin (`@plugin "daisyui"`) with a custom light theme remapped to the logo palette: paper `#F7F6FF`, feather `#C0C8FF`, quill `#7B85F0`, ink `#3F4285`. Display type is Fraunces; UI type is Plus Jakarta Sans, both loaded with `next/font`. `package.json` sets `"browserslist": "> 1%"` so Turbopack’s Lightning CSS does not polyfill modern CSS in a way that breaks daisyUI layouts (see [daisyUI Next.js install](https://daisyui.com/docs/install/nextjs/)).

The public marketing site uses the shared Navbar and Footer. The dashboard is a separate app shell with its own top bar (logo, role context, user menu, logout) and does not render the marketing footer.

## Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `NODE_ENV` | Set by Next.js | `development`, `test`, or `production`. Leave it empty in `.env.local`. `npm run seed` refuses to run when it is `production` unless you pass `--force` / `SEED_FORCE=1` on a disposable database. |
| `MONGODB_URI` | Always | MongoDB connection string. |
| `AUTH_SECRET` | Always | Secret used to sign sessions. |
| `AUTH_URL` | Always | Canonical site URL, such as `http://localhost:3000` locally. Auth.js does not accept the Host header in its place. Also used for public canonical / Open Graph URLs. |
| `NEXTAUTH_SECRET` | Only if `AUTH_SECRET` is unset | Alias copied onto `AUTH_SECRET`. |
| `NEXTAUTH_URL` | Only if `AUTH_URL` is unset | Alias copied onto `AUTH_URL`. |
| `ADMIN_EMAIL` | For `npm run seed` | Email of the superadmin to create. |
| `ADMIN_PASSWORD` | For `npm run seed` | Password for that account (min 10 chars, letter + number). The command does not print it. |
| `SEED_FORCE` | Optional | Set to `1` with `npm run seed -- --force` only on a disposable database when `NODE_ENV=production`. |
| `HEALTH_CHECK_SECRET` | Only to use `/api/health` | Shared secret. Send it as `x-health-token`. The route returns 404 until this is set and the header matches. |
| `HUGGINGFACE_API_KEY` | Optional | Enables the Hugging Face writing and analysis routes. |
| `HF_IMAGE_DAILY_QUOTA` | Optional | Positive integer. Image generation stays off until this is set. |
| `TRUSTED_PROXY_HEADER` | Optional | The one proxy header trusted for a client address, for example `x-real-ip`. The address is hashed with `AUTH_SECRET` and is not stored raw. |
| `SMTP_HOST` | Optional | SMTP host. Mail is skipped unless this and `EMAIL_FROM` are both set. |
| `EMAIL_FROM` | With `SMTP_HOST` | From address for verification and password-reset mail. |
| `SMTP_PORT` | Optional | SMTP port. Defaults to 587. Port 465 uses TLS. |
| `SMTP_USER` | Optional | SMTP username when the server requires auth. |
| `SMTP_PASS` | With `SMTP_USER` | SMTP password. |
| `NEXT_PUBLIC_API_URL` | Optional | API base used by the browser. Defaults to `/api`. |
| `CLOUDINARY_CLOUD_NAME` | For uploads, `next/image`, and deletes | Cloudinary cloud name. `next/image` may load only `res.cloudinary.com/<this cloud>/…`. |
| `CLOUDINARY_API_KEY` | For uploads and deletes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | For uploads and deletes | Cloudinary API secret. |
| `REDIS_URL` | For rate-limited routes | Redis connection URL, for example `redis://127.0.0.1:6379`. |

## Roles and dashboard routes

| Role | Can | Cannot |
| --- | --- | --- |
| Superadmin | Everything, including changing roles, deactivating accounts, and managing banners | Manage an equal or higher role |
| Admin | Approve and reject posts and comments, approve users, manage banners, open the admin dashboard | Deactivate accounts, change roles, or act on an equal or higher role |
| Author | Create, edit, and delete their own posts; comment and react on published posts; open authoring tools | Approve posts or comments, edit someone else's post, or manage banners. Sign-in requires `isApproved` |
| User (reader) | Comment, like or dislike a published post, edit profile, open a simple dashboard (activity + role upgrade) | Create posts or open authoring / admin routes |

An author who asks to publish a post gets `pending` and the post stays unapproved until someone with `approveBlog` approves it. Comments are public only after someone with `approveComment` approves them. Admin and superadmin comments are approved immediately.

### Route matrix

| Route | Reader | Author | Admin / Superadmin |
| --- | --- | --- | --- |
| `/dashboard` | Overview, activity, upgrade CTA | Author overview + stats | Same + admin shortcuts |
| `/dashboard/settings` | Profile, password, email, role upgrade | Profile + admin upgrade request | Profile settings |
| `/dashboard/blogs`, `/create`, `/edit/*` | Forbidden | Yes | Yes |
| `/dashboard/analytics` | Forbidden | Yes | Yes |
| `/dashboard/admin`, `/dashboard/admin/users` | Forbidden | Forbidden | Yes (`viewAdminDashboard` / `viewUsers`) |

Sidebar links match these permissions. Dead marketing chrome is not reused inside the dashboard shell.

## Seeding

Fixtures live under `scripts/seed-data/`.

```bash
# Full truncate + seed (every collection the app uses)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-long-password1' npm run seed
```

`npm run seed`:

1. Refuses when `NODE_ENV=production` unless `--force` or `SEED_FORCE=1` (documented for disposable DBs only).
2. Truncates users, blogs, comments, likes, banners, blog views, and role-upgrade requests, then syncs indexes to the current schemas.
3. Seeds users (superadmin from env, plus admin / authors / readers / a pending unapproved author), blogs, comments, likes/dislikes, banners, views, and a pending role upgrade.
4. Verifies the superadmin password hash and `canSignIn` flags (`isActive`, `isApproved`, `emailVerified`, `role=superadmin`) before exiting.

After seed, sign in at `/auth/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Redis must be running.

## Auth

Sign in at `/auth/login` with email and password. Sessions last one hour. Each request reloads the user and drops the session if the account is inactive, the author is no longer approved, or `sessionVersion` has changed.

Passwords are at least 10 characters and include a letter and a number. Registration accepts the `user` and `author` roles. New accounts must verify their email before uploads and other verified actions. Authors also need an admin to approve the account before they can sign in. Inactive accounts cannot sign in. Readers, admins, and superadmins do not need `isApproved` to sign in. `emailVerified` is not required for login.

A wrong password and a login rate-limit block both return “Invalid email or password”. If Redis is missing or down, login reports that rate limiting is unavailable instead of signing the user in.

Verification and reset mail go out only when SMTP is configured. Without SMTP, those links are not sent.

## Public SEO

Public pages set title, description, Open Graph, canonical URL (from `AUTH_URL`), and robots. Blog detail and author profile metadata are generated from published data. Do not put secrets or private emails into meta tags.

## Uploads

`POST /api/upload` stores a JPEG, PNG, or WebP for a verified signed-in user. Banner uploads use `POST /api/admin/banners/upload` and require `manageBanners`. The server ignores the client filename, checks magic bytes, and rejects anything over 5 MB. The generated object name cannot leave the upload root.

Bytes go to Cloudinary. The database stores the HTTPS `secure_url` for this cloud only: `https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public id>.<ext>`, with no query string or credentials. Blog and banner image fields reject any other URL. If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, or `CLOUDINARY_API_SECRET` is missing, the upload returns 400 with that requirement in the error.

Replacing or clearing a post image deletes the previous Cloudinary asset. Replacing or clearing a banner image or background does the same, including when the banner itself is deleted.

## Rate limits

One Redis sliding window covers every limited route. A missing `REDIS_URL` or a Redis error returns 503 with a clear message. Login reports that same failure instead of creating a session.

| Route | Limit |
| --- | --- |
| Login | 10 attempts per email every 15 minutes |
| Register | 5 per email and 20 per trusted client address every hour |
| Password reset | 5 per email every hour |
| AI routes | 20 per user every 10 minutes |
| Image generation | `HF_IMAGE_DAILY_QUOTA` per user per day |

The register IP limit applies only when `TRUSTED_PROXY_HEADER` is set and that header is present.

## Reactions

A published post has two reactions, like and dislike. A signed-in user has one reaction on a post. Choosing the other reaction replaces the first. Choosing the same reaction again removes it. The public post shows both counts. A visitor who is not signed in sees the counts and cannot react.

`POST /api/likes` with `{ "blogId", "reaction": "like" | "dislike" }` is that single reaction flow.

Like counts include rows whose `type` is `like`, and also older rows with a missing `type`. On database connect, the app sets each missing `type` to `like` once per process.

## Public author profiles

The byline on a post links to `/authors/[authorId]`. Anyone, including a visitor who is not signed in, can open it. The page shows that author's public profile and the first 10 published posts, newest first, with each post's like and dislike counts. Later pages are `/authors/[authorId]?page=2`. It does not show an email address, and it does not list drafts or other unpublished posts.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Without `REDIS_URL`, the Redis sliding-window test is skipped and the rest of the suite still runs. To exercise Redis locally, start Redis and run `REDIS_URL=redis://127.0.0.1:6379 npm test`. CI starts MongoDB 7 and Redis 7, then runs lint, typecheck, tests, and the production build.

`GET /api/health` with header `x-health-token: <HEALTH_CHECK_SECRET>` returns `{ "ok": true }` when MongoDB is connected. Any other caller gets 404.
