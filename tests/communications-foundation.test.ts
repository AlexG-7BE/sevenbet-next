import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type {
  CommunicationAccountDirectory,
  EmailTransport,
} from "../lib/communications/contracts";
import { createCommunicationAuditMetadata } from "../lib/communications/audit-metadata";
import {
  assessCommunicationAuthority,
  type CommunicationAuthorityEvidence,
} from "../lib/communications/purpose-policy";
import { resolveCommunicationRuntimeConfig } from "../lib/communications/runtime-config";
import { CommunicationService } from "../lib/communications/service";
import { renderCommunicationTemplate } from "../lib/communications/templates";
import { DisabledEmailTransport, MemoryEmailTransport } from "../lib/communications/transports";

const config = resolveCommunicationRuntimeConfig({
  NEXT_PUBLIC_SITE_URL: "https://sevenbet.example",
  SEVENBET_ACCOUNT_EMAIL_FROM: "account@sevenbet.example",
  SEVENBET_PROGRAMME_EMAIL_FROM: "programme@sevenbet.example",
  SEVENBET_EMAIL_REPLY_TO: "support@sevenbet.example",
});

const accounts: CommunicationAccountDirectory = {
  async resolveAccountEmail(userId) {
    return userId === "known-user" ? { email: "Owner@Example.com" } : null;
  },
};

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("communications purposes are closed and deny unknown or commercial use", () => {
  assert.deepEqual(assessCommunicationAuthority("UNKNOWN", {}), {
    allowed: false,
    purpose: null,
    code: "UNKNOWN_PURPOSE",
  });
  assert.equal(assessCommunicationAuthority("ACCOUNT_SECURITY", { accountSecurityNecessary: true }).allowed, false);
  assert.equal(assessCommunicationAuthority("ACCOUNT_SECURITY", { accountSecurityNecessary: true, approvedSecurityWorkflow: true }).allowed, true);
  assert.equal(assessCommunicationAuthority("PROGRAMME_USER_REQUESTED_REMINDER", { userRequestedReminder: true }).allowed, true);
  assert.equal(assessCommunicationAuthority("PROGRAMME_ENGAGEMENT", { programmeEngagementOptIn: true }).allowed, true);
  assert.deepEqual(
    assessCommunicationAuthority("COMMERCIAL_MARKETING", { commercialMarketingConsent: true }),
    { allowed: false, purpose: "COMMERCIAL_MARKETING", code: "COMMERCIAL_MARKETING_DISABLED" },
  );
});

test("Google identity, account creation and Programme activity never imply engagement authority", () => {
  const inferredSignals = {
    googleAuthenticated: true,
    googleEmailVerified: true,
    accountCreated: true,
    missionCompleted: true,
  };
  assert.equal(
    assessCommunicationAuthority("PROGRAMME_ENGAGEMENT", inferredSignals as unknown as CommunicationAuthorityEvidence).allowed,
    false,
  );
});

test("runtime sender configuration fails closed on partial or unsafe values", () => {
  assert.equal(resolveCommunicationRuntimeConfig({}), null);
  assert.equal(resolveCommunicationRuntimeConfig({
    NEXT_PUBLIC_SITE_URL: "javascript:alert(1)",
    SEVENBET_ACCOUNT_EMAIL_FROM: "account@example.com",
    SEVENBET_PROGRAMME_EMAIL_FROM: "programme@example.com",
    SEVENBET_EMAIL_REPLY_TO: "support@example.com",
  }), null);
  assert.equal(resolveCommunicationRuntimeConfig({
    NEXT_PUBLIC_SITE_URL: "https://sevenbet.example/untrusted-path",
    SEVENBET_ACCOUNT_EMAIL_FROM: "account@example.com",
    SEVENBET_PROGRAMME_EMAIL_FROM: "programme@example.com",
    SEVENBET_EMAIL_REPLY_TO: "support@example.com",
  }), null);
  assert.equal(resolveCommunicationRuntimeConfig({
    NEXT_PUBLIC_SITE_URL: "https://user:password@sevenbet.example",
    SEVENBET_ACCOUNT_EMAIL_FROM: "account@example.com",
    SEVENBET_PROGRAMME_EMAIL_FROM: "programme@example.com",
    SEVENBET_EMAIL_REPLY_TO: "support@example.com",
  }), null);
  assert.ok(config);
});

test("fixed templates are purpose-compatible, privacy-safe and tracking-free", () => {
  assert.ok(config);
  const account = renderCommunicationTemplate("ACCOUNT_SECURITY_GENERIC", "ACCOUNT_SECURITY", config.siteUrl);
  const requested = renderCommunicationTemplate("PROGRAMME_USER_REQUESTED_REMINDER", "PROGRAMME_USER_REQUESTED_REMINDER", config.siteUrl);
  const engagement = renderCommunicationTemplate("PROGRAMME_ENGAGEMENT_REMINDER", "PROGRAMME_ENGAGEMENT", config.siteUrl);
  assert.ok(account && requested && engagement);
  assert.equal(renderCommunicationTemplate("PROGRAMME_ENGAGEMENT_REMINDER", "ACCOUNT_SECURITY", config.siteUrl), null);
  assert.equal(renderCommunicationTemplate("COMMERCIAL_MARKETING", "PROGRAMME_ENGAGEMENT", config.siteUrl), null);
  const content = [account, requested, engagement].map((message) => `${message.html}\n${message.text}`).join("\n");
  assert.doesNotMatch(content, /<img|pixel|utm_|click.?track|open.?track|affiliate|casino|bonus/i);
  assert.doesNotMatch(content, /moment map|cue|urge|boundary|reflection|self-check|help activity/i);
});

test("service resolves the authoritative account address and suppresses duplicate delivery", async () => {
  assert.ok(config);
  const transport = new MemoryEmailTransport();
  const service = new CommunicationService(accounts, transport, config);
  const request = {
    userId: "known-user",
    purpose: "ACCOUNT_SECURITY",
    authority: { accountSecurityNecessary: true, approvedSecurityWorkflow: true },
    template: "ACCOUNT_SECURITY_GENERIC",
    idempotencyKey: "account-security:1234567890",
    to: "attacker@example.invalid",
    reflection: "PRIVATE-REFLECTION-SENTINEL",
  };

  assert.deepEqual(await service.deliver(request), { status: "delivered", code: "DELIVERY_ACCEPTED" });
  assert.deepEqual(await service.deliver(request), { status: "duplicate", code: "DUPLICATE_SUPPRESSED" });
  const delivered = transport.deliveredMessages();
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].to, "owner@example.com");
  assert.equal(delivered[0].from, "account@sevenbet.example");
  assert.equal(delivered[0].replyTo, "support@sevenbet.example");
  assert.equal(JSON.stringify(delivered).includes("attacker@example.invalid"), false);
  assert.equal(JSON.stringify(delivered).includes("PRIVATE-REFLECTION-SENTINEL"), false);
});

test("audit metadata is operationally bounded and excludes recipients and content", () => {
  const metadata = createCommunicationAuditMetadata({
    userId: "known-user",
    purpose: "ACCOUNT_SECURITY",
    authority: { accountSecurityNecessary: true, approvedSecurityWorkflow: true },
    template: "ACCOUNT_SECURITY_GENERIC",
    idempotencyKey: "account-security:1234567890",
  }, { status: "delivered", code: "DELIVERY_ACCEPTED" }, new Date("2026-08-09T10:00:00.000Z"));
  assert.deepEqual(metadata, {
    purpose: "ACCOUNT_SECURITY",
    status: "delivered",
    reasonCode: "DELIVERY_ACCEPTED",
    internalUserId: "known-user",
    idempotencyReference: "account-security:1234567890",
    occurredAt: "2026-08-09T10:00:00.000Z",
  });
  assert.doesNotMatch(JSON.stringify(metadata), /@|subject|html|body|recipient/i);
});

test("disabled and failing transports return bounded fail-closed results", async () => {
  assert.ok(config);
  const request = {
    userId: "known-user",
    purpose: "PROGRAMME_USER_REQUESTED_REMINDER",
    authority: { userRequestedReminder: true },
    template: "PROGRAMME_USER_REQUESTED_REMINDER",
    idempotencyKey: "requested-reminder:123456",
  };
  const disabled = new CommunicationService(accounts, new DisabledEmailTransport(), config);
  assert.deepEqual(await disabled.deliver(request), { status: "unavailable", code: "TRANSPORT_NOT_CONFIGURED" });

  const failingTransport: EmailTransport = { async deliver() { throw new Error("provider detail sentinel"); } };
  const failing = new CommunicationService(accounts, failingTransport, config);
  assert.deepEqual(await failing.deliver(request), { status: "failed", code: "DELIVERY_FAILED" });

  const failingDirectory: CommunicationAccountDirectory = { async resolveAccountEmail() { throw new Error("database detail sentinel"); } };
  const directoryFailure = new CommunicationService(failingDirectory, new MemoryEmailTransport(), config);
  assert.deepEqual(await directoryFailure.deliver(request), { status: "failed", code: "DELIVERY_FAILED" });
});

test("communications foundation has no public send route or protected-data import", () => {
  const communicationSources = filesBelow("lib/communications")
    .filter((path) => path.endsWith(".ts"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  const publicRouteSources = filesBelow("app/api")
    .filter((path) => path.endsWith(".ts"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  assert.doesNotMatch(communicationSources, /from ["'][^"']*(programme|affiliate|self-check|responsible-gambling|limit-tracker)[^"']*["']/i);
  assert.doesNotMatch(publicRouteSources, /communications\/(service|factory|transports)/);
  assert.doesNotMatch(communicationSources, /resend|postmark|sendgrid|mailgun|nodemailer|smtp|gmail/i);
  assert.doesNotMatch(communicationSources, /console\.(log|warn|error)/);
});
