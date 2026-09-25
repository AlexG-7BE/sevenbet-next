import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertHumanCommercialStageTransition } from "../lib/commercial/stage-policy";

const facts = (overrides: Partial<{ qualificationRationale: string | null; nextActionSummary: string | null; evidenceCategories: string[]; applicationStates: string[] }> = {}) => ({ qualificationRationale: null, nextActionSummary: null, evidenceCategories: [], applicationStates: [], ...overrides });
const transition = (target: Parameters<typeof assertHumanCommercialStageTransition>[0]["target"], stageFacts = facts(), reason = "Explicit human decision") => assertHumanCommercialStageTransition({ current: "PROSPECT", target, reason, facts: stageFacts });

test("valid PROSPECT does not imply a relationship", () => assert.doesNotThrow(() => transition("PROSPECT")));
test("QUALIFIED requires rationale and qualification evidence", () => { assert.throws(() => transition("QUALIFIED")); assert.doesNotThrow(() => transition("QUALIFIED", facts({ qualificationRationale: "Fit documented", evidenceCategories: ["QUALIFICATION"] }))); });
test("draft outreach does not establish APPLIED", () => assert.throws(() => transition("APPLIED", facts({ applicationStates: ["DRAFT"] }))));
test("APPLIED requires an actual external action", () => assert.doesNotThrow(() => transition("APPLIED", facts({ applicationStates: ["SENT"], evidenceCategories: ["EXTERNAL_ACTION"] }))));
test("NEGOTIATING requires negotiation evidence", () => { assert.throws(() => transition("NEGOTIATING")); assert.doesNotThrow(() => transition("NEGOTIATING", facts({ evidenceCategories: ["NEGOTIATION"] }))); });
test("APPROVED requires direct approval evidence", () => { assert.throws(() => transition("APPROVED", facts({ evidenceCategories: ["APPLICATION_PATH"] }))); assert.doesNotThrow(() => transition("APPROVED", facts({ evidenceCategories: ["APPROVAL"] }))); });
test("a public affiliate application page cannot imply APPROVED", () => assert.throws(() => transition("APPROVED", facts({ evidenceCategories: ["APPLICATION_PATH", "MARKET_RELEVANCE"] }))));
test("ACTIVE is impossible through ordinary CRM transition", () => assert.throws(() => transition("ACTIVE"), /separate commercial activation authority/));
test("REJECTED requires rejection evidence and ON_HOLD requires reason", () => { assert.throws(() => transition("REJECTED")); assert.doesNotThrow(() => transition("REJECTED", facts({ evidenceCategories: ["REJECTION"] }))); assert.throws(() => transition("ON_HOLD", facts(), "")); });

test("commercial implementation has no Programme-domain or public DTO coupling", async () => {
  const repository = await readFile(new URL("../lib/repositories/commercial.repository.ts", import.meta.url), "utf8");
  assert.doesNotMatch(repository, /programme|userProgress|help usage/i);
});
test("CRM code cannot mutate affiliate runtime authority", async () => { const repository = await readFile(new URL("../lib/repositories/commercial.repository.ts", import.meta.url), "utf8"); assert.doesNotMatch(repository, /affiliateProgram\.(update|create)|affiliateOffer\.(update|create)|affiliateTrackingLink\.(update|create)/); });
test("prospect, child records, runs and operations have durable idempotency constraints", async () => { const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"); assert.match(schema, /creationIdempotencyKey\s+String\?\s+@unique/); assert.ok((schema.match(/@@unique\(\[opportunityId, idempotencyKey\]\)/g) ?? []).length >= 6); assert.match(schema, /model CommercialAgentOperation[\s\S]*@@unique\(\[idempotencyKey\]\)/); });
test("commercial terms have a required evidence relation and create new records", async () => { const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"); const repository = await readFile(new URL("../lib/repositories/commercial.repository.ts", import.meta.url), "utf8"); assert.match(schema, /model CommercialTerm[\s\S]*evidenceId\s+String\s+@db\.Uuid/); assert.match(repository, /commercialTerm\.create/); assert.doesNotMatch(repository, /commercialTerm\.upsert/); });
test("stage history records actor, evidence, previous/new stage and reason", async () => { const repository = await readFile(new URL("../lib/repositories/commercial.repository.ts", import.meta.url), "utf8"); assert.match(repository, /previousStage: current\.stage/); assert.match(repository, /newStage: target/); assert.match(repository, /evidenceId: evidenceIds\[0\]/); assert.match(repository, /reason,/); });
test("Commercial reporting distinguishes detailed attribution, aggregate accounting and unavailable outcomes", async () => {
  const page = await readFile(new URL("../app/admin/(protected)/commercial/analytics/page.tsx", import.meta.url), "utf8");
  const nav = await readFile(new URL("../components/admin/commercial/CommercialNav.tsx", import.meta.url), "utf8");
  assert.match(page, /Detailed runtime attribution/);
  assert.match(page, /Aggregate-only accounting/);
  assert.match(page, /historical click coverage/);
  assert.match(page, /never add their totals/);
  assert.match(page, /No verified registrations, FTDs, revenue or commission source/);
  assert.match(page, /\/admin\/analytics\?view=commercial/);
  assert.match(page, /\/api\/admin\/affiliate\/outbound-clicks/);
  assert.doesNotMatch(page, /no verified clicks/i);
  assert.match(nav, /href="\/admin\/commercial\/analytics">Reporting<\/Link>/);
});

test("current Commercial Ops documentation records connector retirement and truthful click boundaries", async () => {
  const operations = await readFile(new URL("../docs/commercial/COMMERCIAL-OPS-01.md", import.meta.url), "utf8");
  const handoff = await readFile(new URL("../docs/commercial/PARTNER-OPS-CRM-HANDOFF.md", import.meta.url), "utf8");
  assert.match(operations, /PR5\s+retired the repository MCP\/OAuth transport/);
  assert.match(operations, /0041_commercial_core_legacy_connector_cleanup` is applied/);
  assert.match(operations, /OutboundClick` attempts and success-only `AffiliateOutboundClickDaily/);
  assert.match(operations, /totals must never be added together/);
  assert.match(operations, /no verified registration, FTD, revenue or commission source/i);
  assert.doesNotMatch(operations, /PR5 is not merged|Analytics remains empty|no qualifying event source/i);
  assert.match(handoff, /exact Casino × country `MarketActivation`/);
  assert.doesNotMatch(handoff, /existing central evaluator/);
});
