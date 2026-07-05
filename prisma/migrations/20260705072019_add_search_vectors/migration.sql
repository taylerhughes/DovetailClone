-- Full-text search columns, generated automatically from existing text columns.
-- Expressed as raw SQL because Prisma's schema DSL has no way to declare
-- Postgres GENERATED ALWAYS AS columns.

ALTER TABLE "Note"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("plainText", '')), 'B')
  ) STORED;

CREATE INDEX "Note_searchVector_idx" ON "Note" USING GIN ("searchVector");

ALTER TABLE "Insight"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("plainText", '')), 'B')
  ) STORED;

CREATE INDEX "Insight_searchVector_idx" ON "Insight" USING GIN ("searchVector");

ALTER TABLE "Highlight"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("quote", ''))
  ) STORED;

CREATE INDEX "Highlight_searchVector_idx" ON "Highlight" USING GIN ("searchVector");