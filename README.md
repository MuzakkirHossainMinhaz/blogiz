# Blogiz

Blogiz is a multi-role blogging platform. Readers discover and engage with published posts; authors draft and publish writing with optional AI assistance; admins govern users, content, and trust.

Signed-in people can comment and leave one like or dislike on a published post. Authors manage their own drafts and posts, and can engage on others’ writing. Admins moderate accounts, posts, and comments. Each author has a public profile at `/authors/[authorId]`, linked from the byline. Images go to Cloudinary. Sign-in, registration, password reset, and AI routes are rate limited with Redis.

AI is assistive and opt-in (title/content polish, optional covers)—not a silent rewrite of the author’s voice. Text polish and analysis use **Google Gemini** (`gemini-2.5-flash`) via `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey). Cover generation: Gemini crafts a vivid image prompt from the post (title, description, content, optional creative direction), **Pollinations.ai** draws it (no API key), then Cloudinary stores the result. Redis enforces AI rate limits from `AI_RATE_LIMIT_MAX_REQUESTS` × `AI_RATE_LIMIT_WINDOW_SECONDS` (defaults 3 / 60 seconds, IP-hashed when `TRUSTED_PROXY_HEADER` is set). Provider failures return specific messages rather than a blank generic error.

Roles match [PLAN.md](PLAN.md) and [DATABASE.md](DATABASE.md): exactly three — `admin` | `author` | `reader`. Blogs use a draft / publish lifecycle. See [GUIDE.md](GUIDE.md) for operations.

## Stack

- Next.js 16 (App Router) and React 19
- TypeScript 7, Tailwind CSS 4, and daisyUI (light theme only)
- Fraunces (display) and Plus Jakarta Sans (UI) via `next/font`
- MongoDB with Mongoose
- Auth.js (`next-auth` 5 beta) with email and password sessions
- Cloudinary for images
- Redis for sliding-window rate limits
- Framer Motion for enter/stagger motion (respects reduced motion)

## Quick start

Use Node.js 22. You need a MongoDB server and a Redis server before the app can sign anyone in.

```bash
cp .env.example .env.local
npm install
npm run seed
npm run dev
```

Fill in `.env.local` from `.env.example`. Every value there is empty on purpose. [GUIDE.md](GUIDE.md) says what each variable is and when it is required.

`npm run seed` truncates all collections and loads realistic fixtures, including an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Sign in at `/auth/login` with those credentials (Redis must be up).

## Scripts

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the development server                       |
| `npm run build`     | Production build                                   |
| `npm start`         | Serve the production build                         |
| `npm run lint`      | ESLint                                             |
| `npm run typecheck` | TypeScript                                         |
| `npm test`          | Vitest                                             |
| `npm run seed`      | Truncate all collections and seed fixtures + admin |

Setup, roles, auth, uploads, rate limits, and how to run the checks are in [GUIDE.md](GUIDE.md).

## Docs

| Doc                        | Use it for                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| [PLAN.md](PLAN.md)         | Product vision, roles/capabilities, AI workflows, delivery phases       |
| [DATABASE.md](DATABASE.md) | MongoDB / Mongoose collections, indexes, and relationships              |
| [GUIDE.md](GUIDE.md)       | Operations: env vars, roles/routes, seeding, auth, uploads, rate limits |
