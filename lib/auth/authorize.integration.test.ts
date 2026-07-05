import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  resolveProjectAccess,
  requireProjectViewAccess,
  requireProjectEditAccess,
  requireProjectOwnerAccess,
} from "@/lib/auth/authorize";

/**
 * Exercises resolveProjectAccess (and the require* wrappers built on it)
 * against a real Postgres database, covering every access combination the
 * organizations/sharing model supports: ownership, individual shares (both
 * roles), org-wide shares (both roles, enabled and disabled), non-membership,
 * and no relation at all.
 */
describe("resolveProjectAccess", () => {
  let ownerId: string;
  let viewerShareUserId: string;
  let editorShareUserId: string;
  let orgViewerId: string;
  let orgEditorId: string;
  let orgDisabledMemberId: string;
  let nonMemberId: string;
  let strangerId: string;
  let organizationId: string;
  let personalProjectId: string;
  let orgProjectId: string;
  let orgSharingDisabledProjectId: string;

  async function makeUser(label: string) {
    const user = await db.user.create({
      data: { id: randomUUID(), name: label, email: `${label}-${randomUUID()}@example.com` },
    });
    return user.id;
  }

  afterAll(async () => {
    await db.user.deleteMany({
      where: {
        id: {
          in: [
            ownerId,
            viewerShareUserId,
            editorShareUserId,
            orgViewerId,
            orgEditorId,
            orgDisabledMemberId,
            nonMemberId,
            strangerId,
          ],
        },
      },
    });
    await db.organization.deleteMany({ where: { id: organizationId } });
  });

  beforeAll(async () => {
    [
      ownerId,
      viewerShareUserId,
      editorShareUserId,
      orgViewerId,
      orgEditorId,
      orgDisabledMemberId,
      nonMemberId,
      strangerId,
    ] = await Promise.all([
      makeUser("owner"),
      makeUser("viewer-share"),
      makeUser("editor-share"),
      makeUser("org-viewer"),
      makeUser("org-editor"),
      makeUser("org-disabled-member"),
      makeUser("non-member"),
      makeUser("stranger"),
    ]);

    const org = await db.organization.create({
      data: { id: randomUUID(), name: "Test Org", slug: `test-org-${randomUUID()}`, createdAt: new Date() },
    });
    organizationId = org.id;

    await db.member.createMany({
      data: [
        { id: randomUUID(), organizationId, userId: orgViewerId, role: "member", createdAt: new Date() },
        { id: randomUUID(), organizationId, userId: orgEditorId, role: "member", createdAt: new Date() },
        { id: randomUUID(), organizationId, userId: orgDisabledMemberId, role: "member", createdAt: new Date() },
      ],
    });

    const personalProject = await db.project.create({
      data: { name: "Personal Project", userId: ownerId },
    });
    personalProjectId = personalProject.id;

    await db.projectShare.createMany({
      data: [
        { projectId: personalProjectId, userId: viewerShareUserId, role: "VIEWER" },
        { projectId: personalProjectId, userId: editorShareUserId, role: "EDITOR" },
      ],
    });

    const orgProject = await db.project.create({
      data: {
        name: "Org-Shared Project",
        userId: ownerId,
        organizationId,
        orgShareEnabled: true,
        orgShareRole: "VIEWER",
      },
    });
    orgProjectId = orgProject.id;

    const orgSharingDisabledProject = await db.project.create({
      data: { name: "Org Project, Sharing Disabled", userId: ownerId, organizationId, orgShareEnabled: false },
    });
    orgSharingDisabledProjectId = orgSharingDisabledProject.id;
  });

  it("returns 'owner' for the project's creator", async () => {
    expect(await resolveProjectAccess(personalProjectId, ownerId)).toBe("owner");
  });

  it("returns the ProjectShare role for an individually-shared viewer", async () => {
    expect(await resolveProjectAccess(personalProjectId, viewerShareUserId)).toBe("viewer");
  });

  it("returns the ProjectShare role for an individually-shared editor", async () => {
    expect(await resolveProjectAccess(personalProjectId, editorShareUserId)).toBe("editor");
  });

  it("returns 'none' for a user with no relation to a personal (non-org) project", async () => {
    expect(await resolveProjectAccess(personalProjectId, strangerId)).toBe("none");
  });

  it("returns the org share role for an org member when org sharing is enabled (viewer)", async () => {
    expect(await resolveProjectAccess(orgProjectId, orgViewerId)).toBe("viewer");
  });

  it("returns editor for an org member when orgShareRole is EDITOR", async () => {
    await db.project.update({ where: { id: orgProjectId }, data: { orgShareRole: "EDITOR" } });
    expect(await resolveProjectAccess(orgProjectId, orgEditorId)).toBe("editor");
    await db.project.update({ where: { id: orgProjectId }, data: { orgShareRole: "VIEWER" } });
  });

  it("returns 'none' for an org member when orgShareEnabled is false", async () => {
    expect(await resolveProjectAccess(orgSharingDisabledProjectId, orgDisabledMemberId)).toBe("none");
  });

  it("returns 'none' for a user who is not a member of the project's organization", async () => {
    expect(await resolveProjectAccess(orgProjectId, nonMemberId)).toBe("none");
  });

  it("returns 'none' for a nonexistent project", async () => {
    expect(await resolveProjectAccess("does-not-exist", ownerId)).toBe("none");
  });

  it("requireProjectViewAccess rejects a user with no access at all", async () => {
    await expect(requireProjectViewAccess(personalProjectId, strangerId)).rejects.toBeTruthy();
  });

  it("requireProjectEditAccess rejects a viewer-level share", async () => {
    await expect(requireProjectEditAccess(personalProjectId, viewerShareUserId)).rejects.toThrow();
  });

  it("requireProjectEditAccess allows an editor-level share", async () => {
    await expect(requireProjectEditAccess(personalProjectId, editorShareUserId)).resolves.toBe("editor");
  });

  it("requireProjectOwnerAccess rejects a non-owner editor", async () => {
    await expect(requireProjectOwnerAccess(personalProjectId, editorShareUserId)).rejects.toThrow();
  });

  it("requireProjectOwnerAccess allows the owner", async () => {
    await expect(requireProjectOwnerAccess(personalProjectId, ownerId)).resolves.toBeUndefined();
  });
});
