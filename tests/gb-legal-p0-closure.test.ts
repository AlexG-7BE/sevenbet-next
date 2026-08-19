import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

const legalDocuments = [
  "GB-PUBLIC-LEGAL-COPY-PACK.md",
  "GB-LEGAL-SITE-PLACEMENT-MAP.md",
  "GB-DPIA.md",
  "GB-PROCESSOR-AND-TRANSFER-REGISTER.md",
  "GB-ICO-FEE-ASSESSMENT.md",
  "GB-ARTICLE-27-REPRESENTATIVE-ASSESSMENT.md",
  "GB-OPENAI-DATA-CONTROLS.md",
  "GB-PECR-ANALYTICS-DECISION.md",
  "GB-COMMERCIAL-ACTIVATION-GATE.md",
  "GB-P0-CLOSURE-REGISTER.md",
  "GB-LEGAL-APPROVAL-PACK.md",
] as const;

const allowedStatuses = new Set([
  "COMPLETE",
  "FINAL — READY FOR CONTROLLER APPROVAL",
  "CONTROL FRAMEWORK COMPLETE — ACTIVATION OFF",
  "BLOCKED — EXTERNAL ACTION REQUIRED",
]);

test("the P0 legal pack is exact, non-duplicative and uses only the closure vocabulary", () => {
  assert.deepEqual(readdirSync("docs/legal").filter((name) => name.endsWith(".md")).sort(), [...legalDocuments].sort());
  for (const document of legalDocuments) {
    const text = source(`docs/legal/${document}`);
    const match = /\*\*Status:\*\*\s+([^\n]+)/.exec(text);
    assert.ok(match, `${document} requires one Status field`);
    assert.ok(allowedStatuses.has(match[1].trim()), `${document} has unsupported status ${match[1]}`);
    assert.match(text, /Detected|Evidence classification|placement|Pack contents|P0 stream/);
  }
  assert.equal(existsSync("docs/legal/GB-POST-LAUNCH-LEGAL-FOLLOW-UP.md"), false);
});

test("GB launch runtime has no non-essential analytics provider or activation path", () => {
  const runtime = [
    ...filesBelow("app"),
    ...filesBelow("components"),
    ...filesBelow("lib"),
  ].filter((path) => /\.(?:ts|tsx)$/.test(path)).map(source).join("\n");
  const packageJson = JSON.parse(source("package.json")) as { dependencies: Record<string, string> };
  assert.equal(packageJson.dependencies["@vercel/analytics"], undefined);
  assert.doesNotMatch(runtime, /@vercel\/analytics/);
  assert.doesNotMatch(source("app/layout.tsx"), /ProductAnalytics/);
  assert.doesNotMatch(source(".env.example"), /NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED/);
  assert.match(source("lib/analytics/product-analytics.ts"), /DISABLED_GB_LAUNCH/);
  assert.doesNotMatch(source("lib/analytics/product-analytics.ts"), /process\.env/);
  assert.match(source("app/(public)/privacy/page.tsx"), /do not run non-essential product analytics, advertising trackers, tracking pixels or session replay/);
});

test("Article 27 particulars are fail-closed and never publish a placeholder", () => {
  const record = source("lib/legal/gb-uk-representative.ts");
  const privacy = source("app/(public)/privacy/page.tsx");
  assert.match(record, /currentGbUkRepresentative: GbUkRepresentative \| null = null/);
  assert.match(privacy, /currentGbUkRepresentative \? \[/);
  assert.match(privacy, /id: "uk-representative"/);
  assert.doesNotMatch(privacy, /\[LEGAL NAME\]|appointment pending/i);
  assert.match(source("docs/legal/GB-ARTICLE-27-REPRESENTATIVE-ASSESSMENT.md"), /must appoint a UK representative in writing/);
});

test("Programme disclosure remains two-step access plus just-in-time explicit consent and withdrawal", () => {
  const component = source("components/programme/ProgramAiFinalPresentation.tsx");
  const adult = component.indexOf("I confirm I am 18 or over");
  const legal = component.indexOf("I agree to the Terms and confirm I have read the Privacy Notice");
  const disclosure = component.indexOf("Before you share.");
  const consent = component.indexOf("I explicitly consent to B4GAMBLE processing what I type or say");
  const withdrawal = component.indexOf("Withdraw consent and clear this draft");
  assert.ok(adult >= 0 && legal > adult && disclosure > legal && consent > disclosure && withdrawal > consent);
  assert.equal(component.match(/I confirm I am 18 or over/g)?.length, 1);
  assert.equal(component.match(/I agree to the Terms and confirm I have read the Privacy Notice/g)?.length, 1);
  assert.match(component, /Google provides identity only; it does not verify age or receive your Programme words/);
});

test("OpenAI content controls remain code-enforced without content logging", () => {
  const adapters = source("lib/programme/program-ai/openai-adapters.ts");
  const guidance = source("lib/programme/program-ai/openai-mission-guidance.ts");
  const combined = `${adapters}\n${guidance}`;
  assert.equal((combined.match(/\/v1\/responses/g) ?? []).length, 2);
  assert.equal((combined.match(/store: false/g) ?? []).length, 2);
  assert.doesNotMatch(combined, /store: true|console\.(?:info|warn|error)\([^\n]*(?:situation|transcript|audio|output|prompt)/i);
  assert.match(adapters, /\/v1\/audio\/transcriptions/);
  assert.match(adapters, /inputCharacters|audioBytes|durationMs/);
});

test("commercial evidence cannot move from unknown to verified by timestamp", () => {
  const mapper = source("lib/repositories/casino-domain.mapper.ts");
  const builder = source("lib/services/casino.service.ts");
  const publicMapper = source("lib/public-casino/public-casino.mapper.ts");
  const evidence = source("lib/affiliate-commercial/gb-domain-evidence.ts");
  const policy = source("lib/jurisdiction/policies/gb.ts");
  const environment = source(".env.example");
  const legacy = /function legacyEvidenceStatus[^}]+}/.exec(mapper)?.[0] ?? "";
  const licenceWrite = /licenses: \{[\s\S]+?countries: \{/.exec(builder)?.[0] ?? "";
  assert.match(legacy, /return "UNKNOWN"/);
  assert.doesNotMatch(legacy, /lastVerifiedAt|VERIFIED/);
  assert.match(builder, /record\.evidence\.some\(\(evidence\) => evidence\.status === "VERIFIED"\)/);
  assert.doesNotMatch(builder, /verified: Boolean\(record\.lastVerifiedAt\)/);
  assert.doesNotMatch(licenceWrite, /record\.verified|new Date\(\)/);
  assert.match(publicMapper, /isVerified: false/);
  assert.match(evidence, /gbCommercialDomainEvidenceRecords:[^=]+\[\] = \[\]/);
  assert.match(policy, /commercialAllowed: false/);
  assert.match(policy, /referralAllowed: false/);
  assert.match(environment, /AFFILIATE_REDIRECT_ENGINE_ENABLED="false"/);
});

test("public safety, affiliate and demonstration disclosures remain at their governed placements", () => {
  const transforms = source("lib/final-handoff/transforms.ts");
  const affiliate = source("app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx");
  const footer = source("components/public-shell/PublicFooter.tsx");
  const demo = source("components/bonus-directory/BonusDirectory.tsx");
  const outbound = source("components/casino-profile/CasinoOutboundAction.tsx");
  assert.match(transforms, /No casino, bonus or affiliate actions appear here/);
  assert.match(transforms, /call 999 or go to A&amp;E now/);
  assert.match(affiliate, /Affiliate link · We may earn commission/);
  assert.match(footer, /Gambling involves financial risk/);
  assert.match(demo, /DEMONSTRATION DATA/);
  assert.match(outbound, /You are about to visit a third-party gambling operator/);
});
