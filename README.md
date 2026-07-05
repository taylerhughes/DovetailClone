# DovetailClone

A self-hosted clone of the core [Dovetail](https://dovetail.com) UX research repository: projects containing rich-text notes, tagged highlights, and synthesized insights, viewable as Grid/Board/Table/Canvas/List, plus AI-assisted tagging and summarization.

Single-user, no auth — see `/root/.claude/plans/i-want-to-create-fluttering-forest.md` (or ask for a recap) for the full architecture and build-order plan.

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

## Scripts

- `npm run dev` / `build` / `start` — Next.js app
- `npm run db:migrate` — apply Prisma migrations (dev)
- `npm run db:generate` — regenerate the Prisma client
- `npm run db:seed` — seed sample data
- `npm run db:studio` — Prisma Studio
- `npm test` — Vitest unit tests

## Stack

Next.js (App Router) + TypeScript, Prisma + Postgres, Tailwind + shadcn/ui, Tiptap (rich text + inline highlights), dnd-kit (Board), TanStack Table (Table), React Flow (Canvas), Anthropic SDK (AI features).
