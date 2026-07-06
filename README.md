# DovetailClone

A self-hosted clone of the core [Dovetail](https://dovetail.com) UX research repository: projects containing rich-text notes, tagged highlights, and synthesized insights, viewable as Grid/Board/Table/Canvas/List, plus cross-project search and AI-assisted tagging/summarization.

Single-user, no auth.

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
