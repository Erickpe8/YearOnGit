# YearOnGit

Your year on GitHub, wrapped.

YearOnGit is a web app that lets GitHub users discover their year in review — commits, top repositories, languages, and more.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Auth.js (GitHub OAuth)
- Prisma + Neon Postgres

## Getting started

1. Copy env vars:

```bash
cp .env.example .env
```

2. Fill in:

- `DATABASE_URL` / `DIRECT_URL` from Neon
- `AUTH_SECRET` (`npx auth secret` or any random 32+ byte string)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` from a GitHub OAuth App
  - Homepage: `http://localhost:3000`
  - Callback: `http://localhost:3000/api/auth/callback/github`

3. Apply migrations and run:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## License

Private project.
