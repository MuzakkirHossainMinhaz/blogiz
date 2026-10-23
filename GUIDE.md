# Blogiz operations

This guide covers local services, environment variables, roles, auth, uploads, rate limits, seeding, and checks for the shipped app. Product intent and schema live in [PLAN.md](PLAN.md) and [DATABASE.md](DATABASE.md). Quick start is in [README.md](README.md).

Copy [`.env.example`](.env.example) to `.env.local` and fill only the values you need. Do not commit secrets.

## Local services

Run these before `npm run dev` or the checks:

- **MongoDB.** `MONGODB_URI` is required. The app does not fall back to localhost.
- **Redis.** `REDIS_URL` is required the first time someone registers, signs in, requests a password reset, or calls an AI route. If it is missing or Redis is down, those routes fail with a clear error (login shows that rate limiting is unavailable instead of a fake bad-password message).
- **Cloudinary.** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are required to upload or delete an image. The API secret stays on the server. Seed data uses Cloudinary-shaped HTTPS URLs for the configured cloud name (or `demo` when unset) so public cards can render.

A local production build also needs a reachable `MONGODB_URI` plus `AUTH_SECRET` and `AUTH_URL`. It does not call Redis or Cloudinary while pages are prerendered.

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
| `HUGGINGFACE_API_KEY`   | Optional                               | Enables writing polish, analysis, and cover generation via Hugging Face Inference Providers. Token needs Inference Providers permission.                                                           |
| `HF_TOKEN`              | Optional                               | Alias used only when `HUGGINGFACE_API_KEY` is unset (matches Hugging Face docs).                                                                                                                   |
| `HF_TEXT_MODEL`         | Optional                               | Chat model for title/content polish. Defaults to `Qwen/Qwen3-4B-Instruct-2507` on the OpenAI-compatible router (`/v1/chat/completions`).                                                            |
| `HF_IMAGE_MODEL`        | Optional                               | Text-to-image model for covers. Defaults to `black-forest-labs/FLUX.1-schnell`.                                                                                                                    |
| `HF_IMAGE_DAILY_QUOTA`  | Optional                               | Positive integer. Image generation stays off until this and a Hugging Face key are set.                                                                                                            |
| `TRUSTED_PROXY_HEADER`  | Optional                               | The one proxy header trusted for a client address, for example `x-real-ip`. The address is hashed with `AUTH_SECRET` and is not stored raw.                                                        |
| `SMTP_HOST`             | Optional                               | SMTP host. Mail is skipped unless this and `EMAIL_FROM` are both set.                                                                                                                              |
| `EMAIL_FROM`            | With `SMTP_HOST`                       | From address for verification and password-reset mail.                                                                                                                                             |
| `SMTP_PORT`             | Optional                               | SMTP port. Defaults to 587. Port 465 uses TLS.                                                                                                                                                     |
| `SMTP_USER`             | Optional                               | SMTP username when the server requires auth.                                                                                                                                                       |
| `SMTP_PASS`             | With `SMTP_USER`                       | SMTP password.                                                                                                                                                                                     |
| `NEXT_PUBLIC_API_URL`   | Optional                               | API base used by the browser. Defaults to `/api`.                                                                                                                                                  |
| `CLOUDINARY_CLOUD_NAME` | For uploads, `next/image`, and deletes | Cloudinary cloud name. `next/image` may load only `res.cloudinary.com/<this cloud>/…`.                                                                                                             |
| `CLOUDINARY_API_KEY`    | For uploads and deletes                | Cloudinary API key.                                                                                                                                                                                |
| `CLOUDINARY_API_SECRET` | For uploads and deletes                | Cloudinary API secret.                                                                                                                                                                             |
| `REDIS_URL`             | For rate-limited routes                | Redis connection URL, for example `redis://127.0.0.1:6379`.                                                                                                                                        |

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

Bytes go to Cloudinary under the `blogiz` folder (`blogiz/avatars`, `blogiz/covers`, or `blogiz` for general uploads). The database stores the HTTPS `secure_url` for this cloud only. Blog thumbnail fields reject any other URL. If Cloudinary env vars are missing, the upload returns 400.

`POST /api/ai/generate-image` creates a cover with Hugging Face, then stores it under `blogiz/covers`. It needs `HUGGINGFACE_API_KEY` (or `HF_TOKEN`), a positive `HF_IMAGE_DAILY_QUOTA`, Redis, a verified signed-in user, and Cloudinary. Failures return a specific error (missing quota, rate limit, bad credentials, provider error) instead of a generic 500.

`POST /api/ai/optimize` polishes title or content (voice-preserving) for authors via chat completions; returns `{ optimized }` for the editor to apply. Missing key/Redis and provider errors surface as clear JSON `{ error, message }` responses.

Blog bodies are Markdown in the editor (preview + public post view share `renderContent`). Tailwind Preflight resets headings/lists, so `.prose` in `globals.css` supplies typography for headings, lists, links, code, quotes, and emphasis.

Profile avatars are uploaded from Settings (`kind=avatars` → `blogiz/avatars`).

Replacing or clearing a post thumbnail or avatar deletes the previous Cloudinary asset when possible.

## Author analytics API

`GET /api/blogs/analytics` (authors and admins) returns summary counts for the signed-in author’s own posts, a draft vs published mix, top published posts by likes, and weekly engagement series (views from `BlogView`, likes from `Reaction`, comments from `Comment`) for the last 12 weeks. Aggregation `$match` on `authorId` uses ObjectId casting. Readers receive 403.

## Rate limits

Auth and AI routes use Redis sliding windows. Missing Redis fails closed with a clear error.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

Vitest covers authz, reactions, seed pipeline, rate limits, and security helpers.

## Related docs

- [PLAN.md](PLAN.md) — Product and engineering plan
- [DATABASE.md](DATABASE.md) — Schema design
- [README.md](README.md) — Overview and quick start
