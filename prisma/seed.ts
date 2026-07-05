import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { colorForIndex } from "@/lib/palette";
import { docToPlainText } from "@/lib/editor/plainText";
import type { JSONContent } from "@tiptap/react";

function sentence(text: string, highlightId?: string): JSONContent {
  return {
    type: "paragraph",
    content: [
      {
        type: "text",
        text,
        ...(highlightId
          ? { marks: [{ type: "highlight", attrs: { highlightId } }] }
          : {}),
      },
    ],
  };
}

function doc(...paragraphs: JSONContent[]): JSONContent {
  return { type: "doc", content: paragraphs };
}

let highlightIdCounter = 0;
function nextHighlightMarkId() {
  highlightIdCounter += 1;
  return `seed-highlight-${highlightIdCounter}`;
}

async function main() {
  console.log("Clearing existing projects…");
  await db.project.deleteMany({});

  // ── Project 1: Onboarding Research ─────────────────────────────
  const onboarding = await db.project.create({
    data: {
      name: "Onboarding Research",
      description: "Interviews and session recordings about first-run experience.",
    },
  });

  const [alice, bob] = await Promise.all([
    db.teamMember.create({
      data: { projectId: onboarding.id, name: "Alice Chen", color: colorForIndex(0) },
    }),
    db.teamMember.create({
      data: { projectId: onboarding.id, name: "Bob Nakamura", color: colorForIndex(1) },
    }),
  ]);

  const confusionTag = await db.tag.create({
    data: { projectId: onboarding.id, name: "Confusion", color: colorForIndex(0) },
  });
  const [navConfusionTag, termConfusionTag, positiveTag, featureReqTag] =
    await Promise.all([
      db.tag.create({
        data: {
          projectId: onboarding.id,
          name: "Navigation confusion",
          color: colorForIndex(1),
          parentId: confusionTag.id,
        },
      }),
      db.tag.create({
        data: {
          projectId: onboarding.id,
          name: "Terminology confusion",
          color: colorForIndex(2),
          parentId: confusionTag.id,
        },
      }),
      db.tag.create({
        data: { projectId: onboarding.id, name: "Positive feedback", color: colorForIndex(3) },
      }),
      db.tag.create({
        data: { projectId: onboarding.id, name: "Feature request", color: colorForIndex(4) },
      }),
    ]);

  const statusField = await db.field.create({
    data: {
      projectId: onboarding.id,
      name: "Status",
      type: "SINGLE_SELECT",
      appliesTo: "BOTH",
      order: 0,
    },
  });
  const [statusNotStarted, statusInProgress, statusDone] = await Promise.all([
    db.fieldOption.create({
      data: { fieldId: statusField.id, label: "Not started", color: colorForIndex(5), order: 0 },
    }),
    db.fieldOption.create({
      data: { fieldId: statusField.id, label: "In progress", color: colorForIndex(6), order: 1 },
    }),
    db.fieldOption.create({
      data: { fieldId: statusField.id, label: "Done", color: colorForIndex(7), order: 2 },
    }),
  ]);

  const themesField = await db.field.create({
    data: {
      projectId: onboarding.id,
      name: "Themes",
      type: "MULTI_SELECT",
      appliesTo: "BOTH",
      order: 1,
    },
  });
  const [themeOnboarding, themeNavigation, themeTerminology] = await Promise.all([
    db.fieldOption.create({
      data: { fieldId: themesField.id, label: "Onboarding", color: colorForIndex(8), order: 0 },
    }),
    db.fieldOption.create({
      data: { fieldId: themesField.id, label: "Navigation", color: colorForIndex(9), order: 1 },
    }),
    db.fieldOption.create({
      data: { fieldId: themesField.id, label: "Terminology", color: colorForIndex(0), order: 2 },
    }),
  ]);

  const assigneeField = await db.field.create({
    data: {
      projectId: onboarding.id,
      name: "Assignee",
      type: "PERSON",
      appliesTo: "BOTH",
      order: 2,
    },
  });

  const priorityField = await db.field.create({
    data: {
      projectId: onboarding.id,
      name: "Priority",
      type: "NUMBER",
      appliesTo: "NOTE",
      order: 3,
    },
  });

  const dueDateField = await db.field.create({
    data: {
      projectId: onboarding.id,
      name: "Due date",
      type: "DATE",
      appliesTo: "NOTE",
      order: 4,
    },
  });

  const jaHighlightId = nextHighlightMarkId();
  const noteJane = await createNote({
    projectId: onboarding.id,
    title: "User interview: Jane",
    paragraphs: [
      sentence("Jane is a long-time user of a competing tool evaluating our onboarding."),
      sentence(
        "She spent almost two minutes looking for the settings menu before giving up and asking for help.",
        jaHighlightId,
      ),
      sentence("Once shown where it was, she said the icon didn't look like a typical gear icon."),
    ],
  });
  const jaHighlight = await db.highlight.create({
    data: {
      noteId: noteJane.id,
      markId: jaHighlightId,
      quote: "She spent almost two minutes looking for the settings menu before giving up and asking for help.",
      order: 0,
    },
  });
  await db.highlightTag.create({
    data: { highlightId: jaHighlight.id, tagId: navConfusionTag.id },
  });
  await setSelectValue(noteJane.id, statusField.id, statusInProgress.id);
  await setMultiSelectValues(noteJane.id, themesField.id, [themeNavigation.id]);
  await setPersonValue(noteJane.id, assigneeField.id, alice.id);
  await setNumberValue(noteJane.id, priorityField.id, 2);
  await setDateValue(noteJane.id, dueDateField.id, daysFromNow(7));

  const marcusHighlightId = nextHighlightMarkId();
  const noteMarcus = await createNote({
    projectId: onboarding.id,
    title: "User interview: Marcus",
    paragraphs: [
      sentence("Marcus is a new user with no prior experience in this product category."),
      sentence(
        'He asked what "highlight" meant in the context of the product, expecting it to mean something like a bookmark.',
        marcusHighlightId,
      ),
      sentence("He suggested adding a short tooltip the first time each key term appears."),
    ],
  });
  const marcusHighlight = await db.highlight.create({
    data: {
      noteId: noteMarcus.id,
      markId: marcusHighlightId,
      quote: 'He asked what "highlight" meant in the context of the product, expecting it to mean something like a bookmark.',
      order: 0,
    },
  });
  await db.highlightTag.createMany({
    data: [
      { highlightId: marcusHighlight.id, tagId: termConfusionTag.id },
      { highlightId: marcusHighlight.id, tagId: featureReqTag.id },
    ],
  });
  await setSelectValue(noteMarcus.id, statusField.id, statusNotStarted.id);
  await setMultiSelectValues(noteMarcus.id, themesField.id, [themeTerminology.id, themeOnboarding.id]);
  await setPersonValue(noteMarcus.id, assigneeField.id, bob.id);
  await setNumberValue(noteMarcus.id, priorityField.id, 3);
  await setDateValue(noteMarcus.id, dueDateField.id, daysFromNow(14));

  const cohortNote = await createNote({
    projectId: onboarding.id,
    title: "Session notes: onboarding cohort",
    paragraphs: [
      sentence("Ran five back-to-back onboarding sessions with new signups this week."),
      sentence("Overall sentiment was positive; most testers completed setup within three minutes."),
      sentence("Several called out the progress indicator as a nice touch that kept them motivated."),
    ],
  });
  const cohortHighlight = await db.highlight.create({
    data: {
      noteId: cohortNote.id,
      wholeNote: true,
      quote: cohortNote.plainText,
      order: 0,
    },
  });
  await db.highlightTag.create({
    data: { highlightId: cohortHighlight.id, tagId: positiveTag.id },
  });
  await setSelectValue(cohortNote.id, statusField.id, statusDone.id);
  await setPersonValue(cohortNote.id, assigneeField.id, alice.id);

  await createNote({
    projectId: onboarding.id,
    title: "Quick note",
    paragraphs: [sentence("Follow up with design about the settings icon change next sprint.")],
  });

  const insight = await createInsight({
    projectId: onboarding.id,
    title: "Synthesis: onboarding confusion around settings & terminology",
    paragraphs: [
      { text: "Multiple participants struggled to locate the settings menu during their first session.", highlightIds: [jaHighlight.id] },
      { text: "Domain-specific terminology like \"highlight\" isn't self-explanatory to new users and should be introduced with lightweight contextual hints.", highlightIds: [marcusHighlight.id] },
      { text: "Despite these frictions, overall onboarding sentiment remained positive across the cohort.", highlightIds: [cohortHighlight.id] },
    ],
  });
  await setSelectValueInsight(insight.id, statusField.id, statusDone.id);
  await setMultiSelectValuesInsight(insight.id, themesField.id, [themeNavigation.id, themeTerminology.id]);

  // Views
  await db.view.create({
    data: { projectId: onboarding.id, entityType: "NOTE", layout: "GRID", name: "All notes", order: 0 },
  });
  await db.view.create({
    data: { projectId: onboarding.id, entityType: "NOTE", layout: "LIST", name: "Simple list", order: 1 },
  });
  await db.view.create({
    data: {
      projectId: onboarding.id,
      entityType: "NOTE",
      layout: "BOARD",
      name: "By status",
      groupByFieldId: statusField.id,
      order: 2,
    },
  });
  await db.view.create({
    data: { projectId: onboarding.id, entityType: "NOTE", layout: "TABLE", name: "Fields table", order: 3 },
  });
  const canvasView = await db.view.create({
    data: { projectId: onboarding.id, entityType: "NOTE", layout: "CANVAS", name: "Whiteboard", order: 4 },
  });
  await db.view.create({
    data: { projectId: onboarding.id, entityType: "INSIGHT", layout: "GRID", name: "All insights", order: 0 },
  });

  await db.canvasCardPosition.createMany({
    data: [
      { viewId: canvasView.id, subjectType: "NOTE", subjectId: noteJane.id, x: 40, y: 40 },
      { viewId: canvasView.id, subjectType: "NOTE", subjectId: noteMarcus.id, x: 340, y: 40 },
      { viewId: canvasView.id, subjectType: "HIGHLIGHT", subjectId: cohortHighlight.id, x: 190, y: 260 },
      { viewId: canvasView.id, subjectType: "INSIGHT", subjectId: insight.id, x: 40, y: 460 },
    ],
  });

  // Sample attachment on Jane's note, saved through the storage adapter
  const imagePath = path.resolve(process.cwd(), "prisma/seed-assets/sample-image.png");
  const imageBuffer = await readFile(imagePath);
  const storageKey = `${noteJane.id}/seed-sample-image.png`;
  await storage.save(storageKey, imageBuffer);
  await db.attachment.create({
    data: {
      noteId: noteJane.id,
      kind: "IMAGE",
      originalName: "sample-image.png",
      mimeType: "image/png",
      sizeBytes: imageBuffer.byteLength,
      storageKey,
    },
  });

  // ── Project 2: Checkout Experience ──────────────────────────────
  const checkout = await db.project.create({
    data: {
      name: "Checkout Experience",
      description: "Usability findings from the redesigned checkout flow.",
    },
  });

  const [paymentIssueTag, uiBugTag] = await Promise.all([
    db.tag.create({ data: { projectId: checkout.id, name: "Payment issue", color: colorForIndex(2) } }),
    db.tag.create({ data: { projectId: checkout.id, name: "UI bug", color: colorForIndex(3) } }),
  ]);

  const checkoutStatusField = await db.field.create({
    data: { projectId: checkout.id, name: "Status", type: "SINGLE_SELECT", appliesTo: "BOTH", order: 0 },
  });
  const [checkoutOpen, checkoutResolved] = await Promise.all([
    db.fieldOption.create({
      data: { fieldId: checkoutStatusField.id, label: "Open", color: colorForIndex(5), order: 0 },
    }),
    db.fieldOption.create({
      data: { fieldId: checkoutStatusField.id, label: "Resolved", color: colorForIndex(6), order: 1 },
    }),
  ]);

  const feeHighlightId = nextHighlightMarkId();
  const feeNote = await createNote({
    projectId: checkout.id,
    title: "Checkout drop-off: shipping fees",
    paragraphs: [
      sentence("Several testers added items to cart but abandoned checkout at the shipping step."),
      sentence(
        "One tester said the shipping fee felt like it appeared \"out of nowhere\" right before payment.",
        feeHighlightId,
      ),
    ],
  });
  const feeHighlight = await db.highlight.create({
    data: {
      noteId: feeNote.id,
      markId: feeHighlightId,
      quote: 'One tester said the shipping fee felt like it appeared "out of nowhere" right before payment.',
      order: 0,
    },
  });
  await db.highlightTag.create({ data: { highlightId: feeHighlight.id, tagId: paymentIssueTag.id } });
  await setSelectValue(feeNote.id, checkoutStatusField.id, checkoutOpen.id);

  const bugHighlightId = nextHighlightMarkId();
  const bugNote = await createNote({
    projectId: checkout.id,
    title: "Mobile checkout button overlap",
    paragraphs: [
      sentence(
        "On small screens, the \"Place order\" button overlaps the promo code field.",
        bugHighlightId,
      ),
      sentence("Reported on two different Android devices during the same testing session."),
    ],
  });
  const bugHighlight = await db.highlight.create({
    data: {
      noteId: bugNote.id,
      markId: bugHighlightId,
      quote: 'On small screens, the "Place order" button overlaps the promo code field.',
      order: 0,
    },
  });
  await db.highlightTag.create({ data: { highlightId: bugHighlight.id, tagId: uiBugTag.id } });
  await setSelectValue(bugNote.id, checkoutStatusField.id, checkoutResolved.id);

  await db.view.create({
    data: { projectId: checkout.id, entityType: "NOTE", layout: "GRID", name: "All notes", order: 0 },
  });

  console.log("Seed complete:");
  console.log(`  Project "${onboarding.name}" (${onboarding.id})`);
  console.log(`  Project "${checkout.name}" (${checkout.id})`);
}

// ── helpers ──────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function createNote({
  projectId,
  title,
  paragraphs,
}: {
  projectId: string;
  title: string;
  paragraphs: JSONContent[];
}) {
  const content = doc(...paragraphs);
  return db.note.create({
    data: {
      projectId,
      title,
      content: content as object,
      plainText: docToPlainText(content),
    },
  });
}

async function createInsight({
  projectId,
  title,
  paragraphs,
}: {
  projectId: string;
  title: string;
  paragraphs: { text: string; highlightIds: string[] }[];
}) {
  const content: JSONContent[] = [];
  for (const p of paragraphs) {
    content.push({ type: "paragraph", content: [{ type: "text", text: p.text }] });
    for (const highlightId of p.highlightIds) {
      content.push({ type: "highlightEmbed", attrs: { highlightId } });
    }
  }
  const docJson = doc(...content);
  const insight = await db.insight.create({
    data: {
      projectId,
      title,
      content: docJson as object,
      plainText: docToPlainText(docJson),
    },
  });
  await db.insightHighlight.createMany({
    data: paragraphs.flatMap((p) =>
      p.highlightIds.map((highlightId) => ({ insightId: insight.id, highlightId })),
    ),
    skipDuplicates: true,
  });
  return insight;
}

async function setSelectValue(noteId: string, fieldId: string, optionId: string) {
  const fv = await db.noteFieldValue.create({ data: { noteId, fieldId } });
  await db.noteFieldValueOption.create({ data: { noteFieldValueId: fv.id, fieldOptionId: optionId } });
}

async function setSelectValueInsight(insightId: string, fieldId: string, optionId: string) {
  const fv = await db.insightFieldValue.create({ data: { insightId, fieldId } });
  await db.insightFieldValueOption.create({ data: { insightFieldValueId: fv.id, fieldOptionId: optionId } });
}

async function setMultiSelectValues(noteId: string, fieldId: string, optionIds: string[]) {
  const fv = await db.noteFieldValue.create({ data: { noteId, fieldId } });
  await db.noteFieldValueOption.createMany({
    data: optionIds.map((fieldOptionId) => ({ noteFieldValueId: fv.id, fieldOptionId })),
  });
}

async function setMultiSelectValuesInsight(insightId: string, fieldId: string, optionIds: string[]) {
  const fv = await db.insightFieldValue.create({ data: { insightId, fieldId } });
  await db.insightFieldValueOption.createMany({
    data: optionIds.map((fieldOptionId) => ({ insightFieldValueId: fv.id, fieldOptionId })),
  });
}

async function setPersonValue(noteId: string, fieldId: string, teamMemberId: string) {
  await db.noteFieldValue.create({ data: { noteId, fieldId, teamMemberId } });
}

async function setNumberValue(noteId: string, fieldId: string, valueNumber: number) {
  await db.noteFieldValue.create({ data: { noteId, fieldId, valueNumber } });
}

async function setDateValue(noteId: string, fieldId: string, isoDate: string) {
  await db.noteFieldValue.create({ data: { noteId, fieldId, valueDate: new Date(isoDate) } });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
