import { expect, test } from "@playwright/test";

import { publicErrorMessages } from "../lib/i18n/public-errors";
import { contactMessages } from "../lib/i18n/static-pages/contact";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const errors = publicErrorMessages("en-GB");

test("unknown route is a branded noindex HTTP 404 with safe no-JS recovery", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/launch-polish-deliberately-missing`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  const heading = page.getByRole("heading", { level: 1, name: "404" });
  await expect(heading).toBeVisible();
  await expect(heading.locator("..")).toContainText(errors.notFoundLost);
  await expect(page.getByRole("link", { name: errors.notFoundHome, exact: true })).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await expect(page.locator("body")).not.toContainText(/digest|stack|database|provider/iu);
});

test("public error boundary renders safe recovery without exposing the local harness error", async ({ page }) => {
  await page.goto(`${baseUrl}/launch-polish-error-harness`, { waitUntil: "domcontentloaded" });
  const alert = page.getByRole("alert", { name: errors.title });
  await expect(alert.getByRole("heading", { level: 1, name: errors.title })).toBeVisible();
  await expect(alert).toContainText(errors.copy);
  await expect(alert.getByRole("button", { name: errors.retry })).toBeEnabled();
  await expect(alert.getByRole("link", { name: errors.home })).toHaveAttribute("href", "/");
  await expect(alert.getByRole("link", { name: errors.help })).toHaveAttribute("href", "/help");
  await expect(page.locator("body")).not.toContainText(/LAUNCH_POLISH_BROWSER_HARNESS|digest|stack|database|provider/iu);
});

test("final handoff Contact link reaches the canonical Contact page", async ({ page }) => {
  await page.goto(`${baseUrl}/terms`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Contact", exact: true }).first().click();
  await expect(page).toHaveURL(`${baseUrl}/en/contact`);
  await expect(page.getByRole("heading", { level: 1, name: "Talk to us." })).toBeVisible();
  await expect(page.locator('link[rel="canonical"][href$="/contact"]')).toHaveCount(1);
  await expect(page.getByRole("link", { name: "support@b4gamble.com" }).first()).toHaveAttribute("href", "mailto:support@b4gamble.com");
  await expect(page.getByRole("link", { name: "Open Help" }).last()).toHaveAttribute("href", "/en/help");
});

test("Contact form has accessible adjacent validation", async ({ page }) => {
  const messages = contactMessages("en-GB");
  await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: messages.submit }).click();
  await expect(page.getByRole("textbox", { name: messages.emailLabel, exact: true })).toBeFocused();
  await expect(page.getByText(messages.emailError)).toBeVisible();
  await expect(page.getByText(messages.subjectError)).toBeVisible();
  await expect(page.getByText(messages.messageError)).toBeVisible();
  await page.getByRole("textbox", { name: messages.emailLabel, exact: true }).fill("not-an-email");
  await page.getByRole("textbox", { name: messages.subjectLabel, exact: true }).fill("Question");
  await page.getByRole("textbox", { name: messages.messageLabel, exact: true }).fill("A complete example message.");
  await page.getByRole("button", { name: messages.submit }).click();
  await expect(page.getByText(messages.emailError)).toBeVisible();
});

test("successful keyboard submission clears fields and suppresses an in-flight duplicate", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/api/contact", async (route) => {
    requestCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, code: "MESSAGE_ACCEPTED" }) });
  });
  await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Name (optional)").fill("Example User");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("visitor@example.invalid");
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Technical issue");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("A complete non-sensitive example message.");
  const submit = page.getByRole("button", { name: "Send message" });
  await submit.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Message sent.")).toBeVisible();
  expect(requestCount).toBe(1);
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("");
});

test("transient delivery error preserves entered text and exposes mail fallback", async ({ page }) => {
  await page.route("**/api/contact", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ ok: false, code: "DELIVERY_UNAVAILABLE" }),
  }));
  await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("visitor@example.invalid");
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Technical issue");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Keep this message after a transient failure.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("We couldn't send your message.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("Keep this message after a transient failure.");
  await expect(page.getByRole("alert").getByRole("link", { name: "support@b4gamble.com" })).toHaveAttribute("href", "mailto:support@b4gamble.com");
});

test("Contact remains usable at mobile width with no horizontal overflow", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  const controls = await page.locator("main input:not([tabindex='-1']), main textarea, main button, main a[class]").evaluateAll((nodes) => nodes
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    })
    .map((node) => ({ text: node.textContent?.trim(), width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }))
    .filter((target) => target.height < 44));
  expect(controls).toEqual([]);
  await page.close();
});

test("no-JavaScript Contact keeps direct email, Privacy and Help while hiding the dynamic form", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const fallback = page.getByRole("region", { name: "Email us directly." });
  await expect(fallback.getByRole("link", { name: "support@b4gamble.com" })).toBeVisible();
  await expect(fallback.getByRole("link", { name: "Privacy Notice" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Help" }).last()).toBeVisible();
  await expect(page.locator("[data-contact-form-panel]")).toBeHidden();
  await expect(fallback.getByText(/The form needs JavaScript\./)).toBeVisible();
  await context.close();
});
