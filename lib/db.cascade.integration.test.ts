import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

/**
 * Exercises cascade-delete behavior against a real Postgres database (the
 * local dev DB — see docker-compose.yml). Not mocked: this is specifically
 * testing that Prisma's onDelete rules in schema.prisma behave as designed.
 */
describe("cascade delete behavior", () => {
  let userId: string;
  let projectId: string;

  afterAll(async () => {
    // Cascades away the project (and everything under it) left over from a
    // failed assertion.
    await db.user.deleteMany({ where: { id: userId } });
  });

  beforeAll(async () => {
    const user = await db.user.create({
      data: { id: randomUUID(), name: "Cascade Test User", email: `cascade-test-${randomUUID()}@example.com` },
    });
    userId = user.id;

    const project = await db.project.create({
      data: { name: "Cascade Test Project", userId },
    });
    projectId = project.id;
  });

  it("deleting a Field removes its FieldValues but leaves the Note intact", async () => {
    const note = await db.note.create({
      data: { projectId, title: "Cascade note", content: { type: "doc", content: [] } },
    });
    const field = await db.field.create({
      data: { projectId, name: "Status", type: "SINGLE_SELECT" },
    });
    const option = await db.fieldOption.create({
      data: { fieldId: field.id, label: "Todo", color: "#000" },
    });
    const fieldValue = await db.noteFieldValue.create({
      data: { noteId: note.id, fieldId: field.id },
    });
    await db.noteFieldValueOption.create({
      data: { noteFieldValueId: fieldValue.id, fieldOptionId: option.id },
    });

    await db.field.delete({ where: { id: field.id } });

    const [remainingValue, remainingOption, remainingNote] = await Promise.all([
      db.noteFieldValue.findUnique({ where: { id: fieldValue.id } }),
      db.fieldOption.findUnique({ where: { id: option.id } }),
      db.note.findUnique({ where: { id: note.id } }),
    ]);

    expect(remainingValue).toBeNull();
    expect(remainingOption).toBeNull();
    expect(remainingNote).not.toBeNull();

    await db.note.delete({ where: { id: note.id } });
  });

  it("deleting a Note removes its Highlights, HighlightTags, and NoteFieldValues, but leaves the Tag and Project intact", async () => {
    const note = await db.note.create({
      data: { projectId, title: "Cascade note 2", content: { type: "doc", content: [] } },
    });
    const tag = await db.tag.create({
      data: { projectId, name: "Cascade tag", color: "#000" },
    });
    const highlight = await db.highlight.create({
      data: { noteId: note.id, quote: "some quote", wholeNote: true },
    });
    await db.highlightTag.create({
      data: { highlightId: highlight.id, tagId: tag.id },
    });
    const field = await db.field.create({
      data: { projectId, name: "Priority", type: "NUMBER" },
    });
    const fieldValue = await db.noteFieldValue.create({
      data: { noteId: note.id, fieldId: field.id, valueNumber: 1 },
    });

    await db.note.delete({ where: { id: note.id } });

    const [
      remainingHighlight,
      remainingHighlightTag,
      remainingFieldValue,
      remainingTag,
      remainingProject,
    ] = await Promise.all([
      db.highlight.findUnique({ where: { id: highlight.id } }),
      db.highlightTag.findUnique({
        where: { highlightId_tagId: { highlightId: highlight.id, tagId: tag.id } },
      }),
      db.noteFieldValue.findUnique({ where: { id: fieldValue.id } }),
      db.tag.findUnique({ where: { id: tag.id } }),
      db.project.findUnique({ where: { id: projectId } }),
    ]);

    expect(remainingHighlight).toBeNull();
    expect(remainingHighlightTag).toBeNull();
    expect(remainingFieldValue).toBeNull();
    expect(remainingTag).not.toBeNull();
    expect(remainingProject).not.toBeNull();
  });
});
