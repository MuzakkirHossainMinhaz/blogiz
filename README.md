# Blogiz

Blogiz is a multi-user blog. Readers can comment, authors can draft posts, and admins approve posts, comments, and author accounts. Images are stored in Cloudinary. Sign-in, registration, password reset, and the AI routes are rate limited in Redis.

Optional Hugging Face helpers can draft text, analyze a post, or generate an image. Those routes stay off until their environment variables are set. Search matches published post text. Content moderation is not configured and that route returns 503.

## Stack

- Next.js 16 (App Router) and React 19
- TypeScript 7 and Tailwind CSS 4
- MongoDB with Mongoose
- Auth.js (`next-auth` 5 beta) with email and password sessions
- Cloudinary for images
- Redis for sliding-window rate limits

## Quick start

Use Node.js 22. You need a MongoDB server and a Redis server before the app can sign anyone in.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Fill in `.env.local` from `.env.example`. Every value there is empty on purpose. [GUIDE.md](GUIDE.md) says what each variable is and when it is required.

Create the first superadmin only on a non-production machine:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-long-password1' npm run seed:admin
```

Sign in at `/auth/login`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest |
| `npm run seed:admin` | Create one superadmin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` |

Setup, roles, auth, uploads, rate limits, and how to run the checks are in [GUIDE.md](GUIDE.md).
