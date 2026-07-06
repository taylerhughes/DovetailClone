# Willard

A self-hosted UX research repository inspired by [Dovetail](https://dovetail.com): projects containing rich-text notes, tagged highlights, and synthesized insights, viewable as Grid/Board/Table/Canvas/List, plus cross-project search and AI-assisted tagging/summarization.

Multi-tenant with email/password + OAuth sign-in, organizations, and per-project sharing.

## Getting started

```bash
# start Postgres (requires Docker)
docker compose up -d

cp .env.example .env   # adjust DATABASE_URL if not using the default docker-compose credentials

npm install
npm run db:migrate
npm run db:seed        # optional: sample projects/notes/tags for manual testing
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable AI features (tag suggestions, summarization), set `ANTHROPIC_API_KEY` in `.env`.

To enable video/audio transcription and highlight reels, set `ASSEMBLYAI_API_KEY` in `.env`
and make sure `ffmpeg` is installed and on `PATH` (`brew install ffmpeg` / `apt install ffmpeg`;
already included in the Docker image).

To enable semantic search (ask-your-research chat, contradiction detection), set
`VOYAGE_API_KEY` in `.env`. This requires Postgres to have the `pgvector` extension installed
(the `docker-compose.yml` Postgres image already includes it; if running Postgres yourself,
install the `pgvector` package for your Postgres version and the app's migrations will
`CREATE EXTENSION IF NOT EXISTS vector` automatically).

For production, set `STORAGE_DRIVER=s3` (plus `AWS_S3_BUCKET`/`AWS_REGION`) to store uploads
in S3 instead of local disk — required for any multi-instance or ephemeral-container
deployment. Credentials come from the AWS SDK's default provider chain: an IAM role in
production, or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` for local testing against a real
bucket.

To send real emails (password reset, email verification, org invites) via AWS SES, set
`EMAIL_FROM_ADDRESS` to a sender identity verified in SES. Leave unset to fall back to logging
the email content/link to the console instead (dev-only, no email actually sent).

Both password-reset and login attempts are rate-limited automatically (Better Auth's built-in
limiter, backed by Postgres); AI/embeddings calls and uploads are rate-limited per-user via
`lib/rateLimit` — see `lib/rateLimit/limits.ts` to tune the budgets.

## Scripts

- `npm run dev` / `build` / `start` — Next.js app
- `npm run db:migrate` — apply Prisma migrations (dev)
- `npm run db:generate` — regenerate the Prisma client
- `npm run db:seed` — seed sample data
- `npm run db:studio` — Prisma Studio
- `npm test` — Vitest unit + integration tests
- `npm run test:e2e` — Playwright smoke tests (starts the dev server automatically)

## Stack

Next.js (App Router) + TypeScript, Prisma + Postgres (full-text search via `tsvector`), Tailwind + shadcn/ui, Tiptap (rich text + inline highlights + highlight embeds), dnd-kit (Board), TanStack Table (Table), React Flow (Canvas), Anthropic SDK (AI features), AssemblyAI (transcription) + ffmpeg (highlight reels).
