import { expect, test } from "@playwright/test";

function isRsc(url: string, headers: Record<string, string>) {
  return url.includes("_rsc=") || headers.rsc === "1";
}

test("casino controls use RSC navigation, preserve results while pending, and support history", async ({ page }) => {
  await page.goto("/casinos", { waitUntil: "networkidle" });
  const initialDocuments: string[] = [];
  const rscRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") initialDocuments.push(request.url());
    if (isRsc(request.url(), request.headers())) rscRequests.push(request.url());
  });

  await page.route("**/*_rsc=*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
  const resultHeading = page.locator("#casino-results h2").first();
  await expect(resultHeading).toBeVisible();
  await page.getByLabel("Sort by").selectOption("NAME_ASC");
  await expect(page.locator('form[data-instant-discovery-form="true"][data-pending="true"]')).toBeVisible();
  await expect(resultHeading).toBeVisible();
  await expect(page).toHaveURL(/sort=NAME_ASC/);
  await expect(page.getByLabel("Sort by")).toHaveValue("NAME_ASC");
  expect(initialDocuments).toHaveLength(0);
  expect(rscRequests.length).toBeGreaterThan(0);

  await page.getByLabel("Sort by").selectOption("NAME_DESC");
  await expect(page).toHaveURL(/sort=NAME_DESC/);
  await page.goBack();
  await expect(page.getByLabel("Sort by")).toHaveValue("NAME_ASC");
  await page.goForward();
  await expect(page.getByLabel("Sort by")).toHaveValue("NAME_DESC");
});

test("casino text search debounces to one replace navigation and Enter applies immediately", async ({ page }) => {
  await page.goto("/casinos", { waitUntil: "networkidle" });
  const search = page.getByRole("searchbox", { name: "Search published reviews" });
  const rscRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/casinos" && url.searchParams.get("q") === "Alpha" && isRsc(request.url(), request.headers())) rscRequests.push(request.url());
  });
  await search.pressSequentially("Alpha", { delay: 35 });
  await expect(page).toHaveURL(/q=Alpha/);
  expect(rscRequests).toHaveLength(1);

  await search.fill("Beta");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=Beta/);
});

test("bonus numeric and select controls auto-apply without a document reload", async ({ page }) => {
  await page.goto("/bonuses", { waitUntil: "networkidle" });
  const form = page.locator('form[action="/bonuses"]').first();
  let documents = 0;
  let rsc = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") documents += 1;
    if (isRsc(request.url(), request.headers())) rsc += 1;
  });
  await form.getByLabel("Sort results").selectOption("lowest-deposit");
  await expect(page).toHaveURL(/sort=lowest-deposit/);
  await form.getByLabel("Maximum deposit").fill("25");
  await expect(page).toHaveURL(/maxDeposit=25/);
  expect(documents).toBe(0);
  expect(rsc).toBeGreaterThanOrEqual(2);
});

test("comparison selection auto-applies while retaining the server-owned repeated query", async ({ page }) => {
  await page.goto("/compare", { waitUntil: "networkidle" });
  const selects = page.locator('select[name="casino"]');
  const first = selects.nth(0);
  const current = await first.inputValue();
  const replacement = await first.locator("option").evaluateAll((options, selected) => options
    .map((option) => (option as HTMLOptionElement).value)
    .find((value) => value && value !== selected), current);
  expect(replacement).toBeTruthy();
  let documents = 0;
  page.on("request", (request) => { if (request.resourceType() === "document") documents += 1; });
  await first.selectOption(replacement!);
  await expect(page).toHaveURL(new RegExp(`casino=${replacement}`));
  await expect(page.getByText("3 of 3 selected · maximum")).toBeVisible();
  expect(documents).toBe(0);
});

test("native GET fallbacks work without JavaScript on all enhanced routes", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/casinos", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Sort by")).toBeVisible();
  await page.getByLabel("Sort by").selectOption("NAME_ASC");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page).toHaveURL(/sort=NAME_ASC/);

  await page.goto("/bonuses", { waitUntil: "networkidle" });
  const bonusForm = page.locator('form[action="/bonuses"]:visible').first();
  await expect(bonusForm.getByLabel("Sort results")).toBeVisible();
  await bonusForm.getByLabel("Sort results").selectOption("lowest-deposit");
  await bonusForm.getByRole("button", { name: "Show Results" }).click();
  await expect(page).toHaveURL(/sort=lowest-deposit/);

  await page.goto("/compare", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Update comparison" })).toBeVisible();
  await page.getByRole("button", { name: "Update comparison" }).click();
  await expect(page).toHaveURL(/country=GB/);
  await context.close();
});

test("GB preference never bypasses commercial authority", async ({ page }) => {
  await page.goto("/casinos?country=GB", { waitUntil: "networkidle" });
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await page.goto("/bonuses?country=GB", { waitUntil: "networkidle" });
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
});
