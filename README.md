# Blogiz

Blogiz is a multi-user blog. Signed-in readers and authors can comment on published posts and leave one like or dislike. Authors draft their own posts, and they can also comment and react on posts they did not write. Admins approve posts, comments, and author accounts. Each author has a public profile at `/authors/[authorId]`, linked from the byline. Images are stored in Cloudinary. Sign-in, registration, password reset, and the AI routes are rate limited in Redis.

Optional Hugging Face helpers can draft text, analyze a post, or generate an image. Those routes stay off until their environment variables are set. Search matches published post text. Content moderation is not configured and that route returns 503.

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

`npm run seed` truncates all collections and loads realistic fixtures, including a superadmin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Sign in at `/auth/login` with those credentials (Redis must be up).

Admin-only upsert without wiping data:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-long-password1' npm run seed:admin
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest |
| `npm run seed` | Truncate all collections and seed fixtures + superadmin |
| `npm run seed:admin` | Upsert one superadmin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |

Setup, roles, auth, uploads, rate limits, and how to run the checks are in [GUIDE.md](GUIDE.md).
