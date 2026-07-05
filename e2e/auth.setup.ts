import { test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/sign-up");
  await page.fill("#name", "E2E Test User");
  await page.fill("#email", email);
  await page.fill("#password", "e2e-test-password-1234");
  await page.click('button[type="submit"]:has-text("Create account")');
  await page.waitForURL("/");
  await page.context().storageState({ path: authFile });
});
