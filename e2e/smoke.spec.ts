import { test, expect } from "@playwright/test";

test("create project → note → highlight → tag → appears in Table view", async ({
  page,
}) => {
  await page.goto("/");
  await page.click('button:has-text("New project")');
  await page.fill("#name", "Smoke Test Project");
  await page.click('button[type="submit"]:has-text("Create project")');
  await page.waitForURL(/\/projects\/.+\/data$/);

  await page.click('button:has-text("New note")');
  await page.waitForURL(/\/data\/.+/);

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.type("Users were confused by the checkout button placement.");
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const el = document.querySelector(".ProseMirror")!;
    const textNode = el.querySelector("p")!.firstChild!;
    const range = document.createRange();
    const text = textNode.textContent!;
    const start = text.indexOf("checkout button placement");
    const end = start + "checkout button placement".length;
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await editor.dispatchEvent("mouseup");
  await page.getByRole("button", { name: "Highlight", exact: true }).click();
  await expect(page.locator("mark[data-highlight-id]")).toBeVisible();

  await page.click('button[aria-label="Add tag"]');
  await page.fill('input[placeholder="Search or create tag…"]', "UI issue");
  await page.click('button:has-text("Create")');
  await expect(page.getByText("UI issue")).toBeVisible();

  // Create a Table view and confirm the tagged note appears in it.
  await page.click('nav a:has-text("Data")');
  await page.waitForURL(/\/data$/);
  await page.click('button[aria-label="New view"]');
  await page.fill('input[placeholder="View name"]', "Table");
  await page.click('[data-slot="dialog-content"] [data-slot="select-trigger"]');
  await page.locator('[role="option"]:has-text("Table")').click();
  await page.click('button:has-text("Create view")');
  await page.waitForURL(/view=/);
  await expect(page.locator("table")).toBeVisible();
  await expect(page.getByText("Untitled")).toBeVisible();
});

test("draft an insight embedding a highlight, then reload and confirm it still renders", async ({
  page,
}) => {
  await page.goto("/");
  await page.click('button:has-text("New project")');
  await page.fill("#name", "Insight Smoke Test");
  await page.click('button[type="submit"]:has-text("Create project")');
  await page.waitForURL(/\/projects\/.+\/data$/);

  await page.click('button:has-text("New note")');
  await page.waitForURL(/\/data\/.+/);
  await page.fill('input[placeholder="Untitled"]', "Interview notes");
  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.type("The onboarding tour was skipped by most first-time users.");
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const el = document.querySelector(".ProseMirror")!;
    const textNode = el.querySelector("p")!.firstChild!;
    const range = document.createRange();
    const text = textNode.textContent!;
    const start = text.indexOf("onboarding tour was skipped");
    const end = start + "onboarding tour was skipped".length;
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await editor.dispatchEvent("mouseup");
  await page.getByRole("button", { name: "Highlight", exact: true }).click();
  await expect(page.locator("mark[data-highlight-id]")).toBeVisible();

  await page.click('nav a:has-text("Insights")');
  await page.waitForURL(/\/insights$/);
  await page.click('button:has-text("New insight")');
  await page.waitForURL(/\/insights\/.+/);
  await page.fill(
    'input[placeholder="Untitled insight"]',
    "Synthesis: onboarding tour skipped",
  );

  const insightEditor = page.locator(".ProseMirror");
  await insightEditor.click();
  await insightEditor.type("Most testers skipped the tour entirely:");
  await page.waitForTimeout(300);

  await page.click('button:has-text("Insert highlight")');
  await expect(page.getByText("onboarding tour was skipped")).toBeVisible();
  await page
    .locator("button", { hasText: "onboarding tour was skipped" })
    .first()
    .click();
  await page.waitForTimeout(600);

  await page.reload();
  await expect(page.getByText("onboarding tour was skipped")).toBeVisible();
  await expect(page.getByText("Interview notes")).toBeVisible();
});
