"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { FieldValueInput } from "@/lib/fieldValueTypes";

async function ensureInsightFieldValue(insightId: string, fieldId: string) {
  return db.insightFieldValue.upsert({
    where: { insightId_fieldId: { insightId, fieldId } },
    create: { insightId, fieldId },
    update: {},
  });
}

export async function setInsightFieldValue(
  insightId: string,
  fieldId: string,
  input: FieldValueInput,
) {
  const user = await requireUser();
  const insight = await db.insight.findUniqueOrThrow({
    where: { id: insightId },
    select: { projectId: true },
  });
  await requireProjectAccess(insight.projectId, user.id);

  switch (input.kind) {
    case "TEXT": {
      await db.insightFieldValue.upsert({
        where: { insightId_fieldId: { insightId, fieldId } },
        create: { insightId, fieldId, valueText: input.value },
        update: { valueText: input.value },
      });
      break;
    }
    case "NUMBER": {
      await db.insightFieldValue.upsert({
        where: { insightId_fieldId: { insightId, fieldId } },
        create: { insightId, fieldId, valueNumber: input.value },
        update: { valueNumber: input.value },
      });
      break;
    }
    case "DATE": {
      await db.insightFieldValue.upsert({
        where: { insightId_fieldId: { insightId, fieldId } },
        create: {
          insightId,
          fieldId,
          valueDate: input.value ? new Date(input.value) : null,
        },
        update: { valueDate: input.value ? new Date(input.value) : null },
      });
      break;
    }
    case "PERSON": {
      await db.insightFieldValue.upsert({
        where: { insightId_fieldId: { insightId, fieldId } },
        create: { insightId, fieldId, teamMemberId: input.teamMemberId },
        update: { teamMemberId: input.teamMemberId },
      });
      break;
    }
    case "SINGLE_SELECT": {
      const fieldValue = await ensureInsightFieldValue(insightId, fieldId);
      await db.insightFieldValueOption.deleteMany({
        where: { insightFieldValueId: fieldValue.id },
      });
      if (input.optionId) {
        await db.insightFieldValueOption.create({
          data: {
            insightFieldValueId: fieldValue.id,
            fieldOptionId: input.optionId,
          },
        });
      }
      break;
    }
    case "MULTI_SELECT": {
      const fieldValue = await ensureInsightFieldValue(insightId, fieldId);
      if (input.checked) {
        await db.insightFieldValueOption.upsert({
          where: {
            insightFieldValueId_fieldOptionId: {
              insightFieldValueId: fieldValue.id,
              fieldOptionId: input.optionId,
            },
          },
          create: {
            insightFieldValueId: fieldValue.id,
            fieldOptionId: input.optionId,
          },
          update: {},
        });
      } else {
        await db.insightFieldValueOption.deleteMany({
          where: {
            insightFieldValueId: fieldValue.id,
            fieldOptionId: input.optionId,
          },
        });
      }
      break;
    }
  }

  revalidatePath(`/projects/${insight.projectId}/insights`);
}
