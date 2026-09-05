import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { deflateSync } from "node:zlib";

import { firstPartyMediaReferenceSchema, MEDIA_INGESTION_PLAN_VERSION, mediaIngestionPlanSchema, type MediaIngestionPlan, type MediaSemanticResult } from "../lib/media-operations/contracts";
import { parsePartnerSnippet, persistedCreativeEvidence } from "../lib/media-operations/parser";
import { buildMediaPlacementPlan } from "../lib/media-operations/planner";
import { createPinnedLookup, fetchRemoteImage, isBlockedRemoteAddress, RemoteImageFetchError, type RemoteImageTransport } from "../lib/media-operations/remote-image-fetch";
import { mediaIngestionCompletionState } from "../lib/media-operations/service";
import { MEDIA_MCP_SCOPES, mediaMcpProtectedResourceMetadata, resolveMediaMcpConfig } from "../lib/mcp/media/config";
import { mediaMcpTools } from "../lib/mcp/media/server";
import { validateOperationalMcpTokenRecord } from "../lib/mcp/commercial/oauth-policy";
import type { StorageProvider } from "../lib/media/storage";
import type { MediaRepository } from "../lib/repositories/media.repository";
import { MediaService } from "../lib/services/media.service";

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  output.write(type, 4, 4, "ascii");
  Buffer.from(data).copy(output, 8);
  output.writeUInt32BE(crc32(output.subarray(4, 8 + data.length)), 8 + data.length);
  return output;
}

function png(width: number, height: number) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

test("untrusted snippets parse anchor images, direct URLs, escaped HTML, multiple creatives, and bounded metadata without retaining raw URLs", () => {
  const rawHref = "https://track.partner.example/click?affiliate_id=super-secret&campaign_id=cmp-42";
  const snippet = [
    `<a href="${rawHref}"><img src="https://cdn.partner.example/banner.png?creative_id=cr-7&lang=fi" width="300" height="250" alt="100% + 50 spins" title="Launch"></a>`,
    `&lt;img src=&quot;https://cdn.partner.example/mobile.gif?banner_id=b-2&amp;currency=EUR&quot; width=&quot;320&quot; height=&quot;100&quot;&gt;`,
    "https://images.partner.example/wide.webp",
  ].join("\n");
  const result = parsePartnerSnippet(snippet);
  assert.equal(result.creatives.length, 3);
  assert.deepEqual(result.creatives.slice(0, 2).map((item) => [item.declaredWidth, item.declaredHeight]), [[300, 250], [320, 100]]);
  assert.equal(result.creatives[0].sourceKind, "ANCHOR_IMAGE");
  assert.equal(result.creatives[0].identifiers.creative_id, "cr-7");
  assert.ok(result.creatives[0].languageClues.includes("fi"));
  assert.ok(result.creatives[0].marketClues.includes("FI"));
  const persisted = JSON.stringify(result.creatives.map(persistedCreativeEvidence));
  assert.doesNotMatch(persisted, /super-secret|cmp-42/);
  assert.doesNotMatch(persisted, /sourceUrl|anchorHref/);
  assert.match(persisted, /track\.partner\.example/);
});

test("script and iframe creatives never execute or expose nested fallback content; only explicit safe data-image attributes are extracted", () => {
  const marker = "MEDIA_PARSER_MUST_NOT_EXECUTE";
  const result = parsePartnerSnippet(`<script src="https://evil.example/run.js" data-image="https://cdn.example/safe.png">globalThis.${marker}=true</script><iframe src="https://evil.example/embed"><img src="https://evil.example/nested.png"></iframe><img src="https://cdn.example/outside.png">`);
  assert.deepEqual(result.unsupportedElements, ["IFRAME", "SCRIPT"]);
  assert.equal(result.creatives.length, 2);
  assert.equal(result.creatives[0].source.pathname, "/safe.png");
  assert.equal(result.creatives[1].source.pathname, "/outside.png");
  assert.ok(result.creatives.every((creative) => creative.source.pathname !== "/nested.png"));
  assert.equal((globalThis as Record<string, unknown>)[marker], undefined);
  assert.ok(result.warnings.includes("UNSAFE_OR_NON_IMAGE_CREATIVE"));
});

test("unsupported executable-only creative is held for review while a failed raster remains failed", () => {
  assert.equal(mediaIngestionCompletionState({ stored: 0, rejected: 0, reviewRequired: false, dryRun: false, contextState: "RESOLVED", creativeCount: 0, unsupportedCount: 1 }), "REVIEW_REQUIRED");
  assert.equal(mediaIngestionCompletionState({ stored: 0, rejected: 1, reviewRequired: false, dryRun: false, contextState: "RESOLVED", creativeCount: 1, unsupportedCount: 0 }), "FAILED");
});

test("unsafe image protocols, userinfo, and malformed dimensions are rejected or flagged", () => {
  const result = parsePartnerSnippet('<img src="javascript:alert(1)" width="lots"><img src="data:image/png;base64,AAAA"><img src="http://cdn.example/a.png"><img src="https://user:pass@cdn.example/a.png"><img src="https://cdn.example/good.png" width="-2">');
  assert.equal(result.creatives.length, 1);
  assert.ok(result.creatives[0].warnings.includes("INVALID_DECLARED_DIMENSIONS"));
  assert.ok(result.warnings.includes("UNSAFE_OR_INVALID_IMAGE_URL"));
});

test("parser handles quote styles, mixed whitespace, missing dimensions, malformed markup, and duplicate creatives deterministically", () => {
  const result = parsePartnerSnippet([
    "<a\n href='https://track.example/click?id=1'>\n<img\talt='Example EN' src='https://cdn.example/a.png' ></a>",
    '<IMG SRC="https://cdn.example/a.png" width="1" height="1">',
    '<img title="No dimensions" src="https://cdn.example/b.jpg">',
    "<img src='https://cdn.example/unterminated.png'",
  ].join("\n"));
  assert.equal(result.creatives.filter((creative) => creative.source.pathname === "/a.png").length, 1);
  assert.equal(result.creatives.find((creative) => creative.source.pathname === "/a.png")?.sourceKind, "ANCHOR_IMAGE");
  assert.deepEqual(result.creatives.find((creative) => creative.source.pathname === "/b.jpg")?.declaredWidth, null);
  assert.ok(result.creatives.length >= 2);
});

test("SSRF policy blocks local, private, link-local, carrier, documentation, multicast, mapped, and metadata address classes", () => {
  for (const address of [
    "0.0.0.0", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1",
    "192.0.2.1", "198.18.0.1", "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255",
    "::", "::1", "::ffff:127.0.0.1", "fc00::1", "fd00::1", "fe80::1", "ff02::1", "2001:db8::1", "2002::1", "3fff::1", "5f00::1",
  ]) assert.equal(isBlockedRemoteAddress(address), true, address);
  for (const address of ["8.8.8.8", "93.184.216.34", "2606:4700:4700::1111"]) assert.equal(isBlockedRemoteAddress(address), false, address);
});

test("remote fetch pins a vetted address and validates content type, signature, dimensions, and redirects", async () => {
  const fixture = png(300, 250);
  let pinned = "";
  const transport: RemoteImageTransport = async ({ address }) => {
    pinned = address.address;
    return { status: 200, headers: { "content-type": "image/png", "content-length": String(fixture.length) }, body: fixture };
  };
  const result = await fetchRemoteImage("https://cdn.example/creative.png", { resolver: async () => [{ address: "93.184.216.34", family: 4 }], transport });
  assert.equal(pinned, "93.184.216.34");
  assert.deepEqual([result.width, result.height, result.mimeType], [300, 250, "image/png"]);

  await assert.rejects(fetchRemoteImage("https://cdn.example/not-image", {
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from("<script>alert(1)</script>") }),
  }), (error: unknown) => error instanceof RemoteImageFetchError && error.code === "CONTENT_TYPE_REJECTED");

  let calls = 0;
  await assert.rejects(fetchRemoteImage("https://cdn.example/redirect", {
    resolver: async (hostname) => [{ address: hostname === "cdn.example" ? "93.184.216.34" : "127.0.0.1", family: 4 }],
    transport: async () => { calls += 1; return { status: 302, headers: { location: "https://localhost/metadata" }, body: new Uint8Array() }; },
  }), (error: unknown) => error instanceof RemoteImageFetchError && ["HOSTNAME_REJECTED", "SSRF_ADDRESS_BLOCKED"].includes(error.code));
  assert.equal(calls, 1);
});

test("pinned DNS lookup supports both single-address and all-address Node client modes", () => {
  const lookup = createPinnedLookup({ address: "93.184.216.34", family: 4 });
  lookup("ignored.example", { all: false }, (error, address, family) => {
    assert.equal(error, null);
    assert.equal(address, "93.184.216.34");
    assert.equal(family, 4);
  });
  lookup("ignored.example", { all: true }, (error, addresses) => {
    assert.equal(error, null);
    assert.deepEqual(addresses, [{ address: "93.184.216.34", family: 4 }]);
  });
});

test("remote fetch accepts the governed raster matrix, preserves GIF animation, and trusts decoded rather than declared dimensions", async () => {
  const fixtures = [
    ["image/jpeg", "public/casino-brands/diamond7/partner-offer.jpg"],
    ["image/png", "public/casino-brands/skol-casino/logo.png"],
    ["image/webp", "public/home/responsive/hero-plan-320.webp"],
    ["image/avif", "public/home/responsive/hero-plan-320.avif"],
    ["image/gif", "public/casino-brands/slotnite/partner-brand.gif"],
  ] as const;
  for (const [mimeType, path] of fixtures) {
    const body = readFileSync(path);
    const result = await fetchRemoteImage(`https://cdn.example/creative.${mimeType.split("/")[1]}`, {
      resolver: async () => [{ address: "93.184.216.34", family: 4 }],
      transport: async () => ({ status: 200, headers: { "content-type": mimeType }, body }),
    });
    assert.equal(result.mimeType, mimeType);
    assert.ok(result.width > 0 && result.height > 0);
    if (mimeType === "image/gif") assert.equal(result.animated, true);
  }
  const declared = parsePartnerSnippet('<img src="https://cdn.example/creative.png" width="1" height="1">').creatives[0];
  const decoded = await fetchRemoteImage(declared.sourceUrl, {
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async () => ({ status: 200, headers: { "content-type": "image/png" }, body: png(300, 250) }),
  });
  assert.deepEqual([declared.declaredWidth, declared.declaredHeight], [1, 1]);
  assert.deepEqual([decoded.width, decoded.height], [300, 250]);
});

test("remote fetch re-vets every redirect, bounds redirects and bytes, rejects encodings, and exposes safe final provenance", async () => {
  const body = png(16, 16);
  const result = await fetchRemoteImage("https://one.example/start", {
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url }) => url.hostname === "one.example"
      ? { status: 302, headers: { location: "https://two.example/next" }, body: new Uint8Array() }
      : url.hostname === "two.example"
        ? { status: 307, headers: { location: "https://three.example/final.png?token=secret" }, body: new Uint8Array() }
        : { status: 200, headers: { "content-type": "image/png" }, body },
  });
  assert.equal(result.finalUrl.hostname, "three.example");
  assert.equal(result.redirects.length, 2);

  let redirectNumber = 0;
  await assert.rejects(fetchRemoteImage("https://redirect.example/0", {
    maximumRedirects: 3,
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async () => ({ status: 302, headers: { location: `https://redirect.example/${++redirectNumber}` }, body: new Uint8Array() }),
  }), (error: unknown) => error instanceof RemoteImageFetchError && error.code === "TOO_MANY_REDIRECTS");

  await assert.rejects(fetchRemoteImage("https://mixed.example/image.png", {
    resolver: async () => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }],
    transport: async () => { throw new Error("transport must not run"); },
  }), (error: unknown) => error instanceof RemoteImageFetchError && error.code === "SSRF_ADDRESS_BLOCKED");
  await assert.rejects(fetchRemoteImage("https://cdn.example/encoded.png", {
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async () => ({ status: 200, headers: { "content-type": "image/png", "content-encoding": "gzip" }, body }),
  }), (error: unknown) => error instanceof RemoteImageFetchError && error.code === "CONTENT_ENCODING_REJECTED");
  await assert.rejects(fetchRemoteImage("https://cdn.example/large.png", {
    maximumBytes: 8,
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async () => ({ status: 200, headers: { "content-type": "image/png" }, body }),
  }), (error: unknown) => error instanceof RemoteImageFetchError && error.code === "FILE_TOO_LARGE");
});

test("Media Operations global checksum mode reuses identical source bytes before metadata processing or storage", async () => {
  const casino = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const data = readFileSync("public/casino-brands/diamond7/partner-offer.jpg");
  const sourceChecksum = createHash("sha256").update(data).digest("hex");
  const existing = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", casinoId: casino, checksum: sourceChecksum, publicUrl: "/media/existing.jpg" };
  let globalLookup = false;
  const lookupChecksums: string[] = [];
  let storageTouched = false;
  const repository = {
    resolveOwnership: async () => ({ casino: { id: casino }, marketProfile: null, casinoBonus: null, affiliateOffer: null }),
    findReusableChecksum: async (checksum: string, casinoId: string) => {
      lookupChecksums.push(checksum);
      globalLookup = casinoId === casino;
      return checksum === sourceChecksum ? existing : null;
    },
    findDuplicateChecksum: async () => { throw new Error("owner-context lookup must not run"); },
  } as unknown as MediaRepository;
  const provider: StorageProvider = {
    name: "LOCAL",
    validate: async () => { storageTouched = true; },
    upload: async () => { throw new Error("duplicate bytes must not upload"); },
    delete: async () => undefined,
    getPublicUrl: () => "",
    exists: async () => true,
    metadata: async () => null,
  };
  const service = new MediaService(repository, () => provider);
  const result = await service.upload({
    file: { name: "same-bytes-different-url.jpg", type: "image/jpeg", size: data.length, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer },
    type: "OTHER", altText: "Reusable creative", casinoId: casino, actorId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", dedupeScope: "GLOBAL",
  });
  assert.equal(globalLookup, true);
  assert.deepEqual(lookupChecksums, [sourceChecksum]);
  assert.equal(result.duplicate, true);
  assert.equal(result.record.id, existing.id);
  assert.equal(storageTouched, false);
});

test("Media Operations global checksum mode retains the processed-byte duplicate fallback", async () => {
  const casino = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const existing = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", casinoId: casino, checksum: "f".repeat(64), publicUrl: "/media/processed.jpg" };
  const data = readFileSync("public/casino-brands/diamond7/partner-offer.jpg");
  const lookupChecksums: string[] = [];
  let storageTouched = false;
  const repository = {
    resolveOwnership: async () => ({ casino: { id: casino }, marketProfile: null, casinoBonus: null, affiliateOffer: null }),
    findReusableChecksum: async (checksum: string) => {
      lookupChecksums.push(checksum);
      return lookupChecksums.length === 2 ? existing : null;
    },
    findDuplicateChecksum: async () => { throw new Error("owner-context lookup must not run"); },
  } as unknown as MediaRepository;
  const provider: StorageProvider = {
    name: "LOCAL",
    validate: async () => { storageTouched = true; },
    upload: async () => { throw new Error("duplicate bytes must not upload"); },
    delete: async () => undefined,
    getPublicUrl: () => "",
    exists: async () => true,
    metadata: async () => null,
  };
  const service = new MediaService(repository, () => provider);
  const result = await service.upload({
    file: { name: "metadata-bearing.jpg", type: "image/jpeg", size: data.length, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer },
    type: "OTHER", altText: "Processed duplicate", casinoId: casino, actorId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", dedupeScope: "GLOBAL",
  });
  assert.equal(lookupChecksums.length, 2);
  assert.notEqual(lookupChecksums[0], lookupChecksums[1]);
  assert.equal(result.duplicate, true);
  assert.equal(result.record.id, existing.id);
  assert.equal(storageTouched, false);
});

test("durable plans accept governed root-relative media and reject ambiguous or executable references", () => {
  assert.equal(firstPartyMediaReferenceSchema.parse("/casino-brands/diamond7/partner-offer.jpg"), "/casino-brands/diamond7/partner-offer.jpg");
  assert.equal(firstPartyMediaReferenceSchema.parse("https://media.b4gamble.com/media/creative.jpg"), "https://media.b4gamble.com/media/creative.jpg");
  assert.equal(firstPartyMediaReferenceSchema.parse("http://localhost:4173/api/media/local/creative.jpg"), "http://localhost:4173/api/media/local/creative.jpg");
  for (const unsafe of ["//partner.example/creative.jpg", "/media/../secret", "/media/%2e%2e/secret", "/media/%2Fsecret", "javascript:alert(1)", "http://partner.example/creative.jpg"]) {
    assert.throws(() => firstPartyMediaReferenceSchema.parse(unsafe));
  }
});

const casinoId = "11111111-1111-4111-8111-111111111111";
const bonusId = "22222222-2222-4222-8222-222222222222";

function semantic(creativeId: string, values: Partial<MediaSemanticResult> = {}): MediaSemanticResult {
  return { creativeId, state: "COMPLETED", provider: "TEST", model: "TEST", brandName: "Example", assetPurpose: "PROMO", language: null, market: null, currency: null, offerText: "100% and 50 spins", offerAmount: null, offerPercentage: 100, freeSpins: 50, promoCode: null, callToActionText: "Join", containsPromotionalText: true, containsFinePrint: true, containsResponsibleGamblingText: false, cropSafety: "SAFE", textReadability: "READABLE", likelyMarkets: [], complianceConcerns: [], confidence: 0.98, explanation: "Fixture", ...values };
}

function planFixture(dimensions: Array<[number, number]>, semanticValues: Partial<MediaSemanticResult>[] = []): MediaIngestionPlan {
  const creatives = dimensions.map((_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    sourceKind: "IMAGE" as const,
    source: { urlHash: "a".repeat(64), origin: "https://cdn.example", pathname: `/creative-${index}.png`, queryKeys: [] },
    anchor: null, declaredWidth: null, declaredHeight: null, alt: null, title: null, providerDomain: "cdn.example", providerReference: null,
    identifiers: {}, languageClues: [], marketClues: [], currencyClues: [], warnings: [],
  }));
  return mediaIngestionPlanSchema.parse({
    version: MEDIA_INGESTION_PLAN_VERSION,
    id: "99999999-9999-4999-8999-999999999999",
    snippetChecksum: "b".repeat(64), state: "INGESTED", dryRun: false, actorId: "33333333-3333-4333-8333-333333333333", source: "ADMIN", providerReference: "fixture", requestedContext: { casinoId, bonusId },
    resolvedContext: { state: "RESOLVED", source: "EXPLICIT", casinoId, casinoSlug: "example", casinoTitle: "Example", bonusId, bonusTitle: "Welcome", affiliateOfferId: null, opportunityId: null, partnerIdentifier: null, trackingDestinationState: "NOT_PRESENT", notes: [] },
    creatives,
    unsupportedElements: [],
    assets: dimensions.map(([width, height], index) => ({ creativeId: creatives[index].id, state: "INGESTED", assetId: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, firstPartyUrl: `https://media.example/${index}.png`, checksum: String(index + 1).repeat(64), mimeType: "image/png", width, height, animated: false, formatFamily: null, resolvedSource: { urlHash: "c".repeat(64), origin: "https://cdn.example", pathname: `/resolved-${index}.png`, queryKeys: [] }, redirectCount: 0, duplicate: false, failureCode: null, failureMessage: null })),
    semanticResults: creatives.map((creative, index) => semantic(creative.id, semanticValues[index])),
    recommendations: [], warnings: [], operations: [], createdAt: "2026-09-05T00:00:00.000Z", updatedAt: "2026-09-05T00:00:00.000Z", analyzedAt: null,
  });
}

test("card, preferred mobile, strip fallback, and wide formats produce deterministic offer placements without touching the detail hero", () => {
  const plan = planFixture([[300, 250], [320, 100], [320, 50], [728, 90]]);
  const recommendations = buildMediaPlacementPlan(plan, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] });
  assert.ok(recommendations.some((item) => item.placement === "BONUS_LISTING_CARD" && item.variant === "DEFAULT" && item.state === "AUTO_ASSIGN_DRAFT"));
  assert.ok(recommendations.some((item) => item.placement === "BONUS_LISTING_CARD" && item.variant === "MOBILE" && item.score >= 96));
  assert.ok(recommendations.some((item) => item.placement === "CASINO_OFFER_BLOCK" && item.variant === "DESKTOP" && item.score >= 94));
  assert.ok(recommendations.filter((item) => item.creativeId === plan.creatives[2].id).every((item) => item.state === "SUGGEST_REVIEW"));
  assert.ok(recommendations.every((item) => item.placement !== "CASINO_DETAIL_HERO"));
});

test("brand art needs completed semantic evidence; large geometry alone never authorizes a hero", () => {
  const unknown = planFixture([[1600, 900]], [{ state: "NEEDS_VISUAL_REVIEW", assetPurpose: "UNKNOWN", confidence: 0 }]);
  assert.ok(buildMediaPlacementPlan(unknown, { bonus: null, existingAssignments: [] }).every((item) => item.placement !== "CASINO_DETAIL_HERO"));
  const brand = planFixture([[1600, 900]], [{ assetPurpose: "BRAND_ART", offerPercentage: null, freeSpins: null, offerText: null }]);
  const result = buildMediaPlacementPlan(brand, { bonus: null, existingAssignments: [] });
  assert.equal(result[0].placement, "CASINO_DETAIL_HERO");
  assert.equal(result[0].state, "AUTO_ASSIGN_DRAFT");
});

test("brand conflicts, incomplete confidence, and unsafe hero crops cannot become automatic draft assignments", () => {
  const lowConfidence = planFixture([[300, 250]], [{ confidence: 0.7 }]);
  assert.ok(buildMediaPlacementPlan(lowConfidence, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] }).every((item) => item.state !== "AUTO_ASSIGN_DRAFT"));

  const wrongBrand = planFixture([[300, 250]], [{ brandName: "Different Casino" }]);
  assert.ok(buildMediaPlacementPlan(wrongBrand, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] }).filter((item) => item.subjectType === "CASINO_BONUS").every((item) => item.state === "REJECT"));

  const unsafeHero = planFixture([[1600, 900]], [{ assetPurpose: "BRAND_ART", offerPercentage: null, freeSpins: null, offerText: null, cropSafety: "UNSAFE" }]);
  const hero = buildMediaPlacementPlan(unsafeHero, { bonus: null, existingAssignments: [] })[0];
  assert.equal(hero.placement, "CASINO_DETAIL_HERO");
  assert.equal(hero.state, "REJECT");
  assert.equal(hero.cropSafe, false);
});

test("the planner keeps one stable best asset per slot and demotes weaker candidates", () => {
  const plan = planFixture([[300, 250], [300, 250]], [{ textReadability: "UNREADABLE" }, { confidence: 1 }]);
  const result = buildMediaPlacementPlan(plan, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] });
  const slot = result.filter((item) => item.placement === "BONUS_LISTING_CARD" && item.variant === "DEFAULT");
  assert.equal(slot.filter((item) => item.state === "AUTO_ASSIGN_DRAFT").length, 1);
  assert.equal(slot.find((item) => item.state === "AUTO_ASSIGN_DRAFT")?.creativeId, plan.creatives[1].id);
  assert.equal(slot.find((item) => item.creativeId === plan.creatives[0].id)?.state, "SUGGEST_REVIEW");
});

test("compatibility formats remain deterministic but only approved geometry auto-assigns", () => {
  const plan = planFixture([[300, 100], [300, 50], [468, 60], [970, 90], [160, 600]]);
  const result = buildMediaPlacementPlan(plan, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] });
  assert.ok(result.some((item) => item.creativeId === plan.creatives[0].id && item.variant === "MOBILE" && item.state === "AUTO_ASSIGN_DRAFT"));
  assert.ok(result.some((item) => item.creativeId === plan.creatives[1].id && item.variant === "MOBILE" && item.state === "SUGGEST_REVIEW"));
  assert.ok(result.filter((item) => [plan.creatives[2].id, plan.creatives[3].id].includes(item.creativeId)).every((item) => item.state === "SUGGEST_REVIEW"));
  assert.ok(result.filter((item) => item.creativeId === plan.creatives[4].id).every((item) => item.state === "LIBRARY_ONLY"));
});

test("a 320×50 creative cannot replace an existing superior 320×100 mobile assignment", () => {
  const plan = planFixture([[320, 50]]);
  const existing = { id: "66666666-6666-4666-8666-666666666666", mediaAssetId: "77777777-7777-4777-8777-777777777777", subjectType: "CASINO_BONUS" as const, subjectId: bonusId, placement: "BONUS_LISTING_CARD" as const, variant: "MOBILE" as const, mediaAsset: { width: 320, height: 100 } };
  const result = buildMediaPlacementPlan(plan, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [existing] });
  const candidate = result.find((item) => item.placement === "BONUS_LISTING_CARD" && item.variant === "MOBILE");
  assert.equal(candidate?.state, "SUGGEST_REVIEW");
  assert.equal(candidate?.existingComparison, "LOWER_PRIORITY");
  assert.equal(candidate?.replacementEligible, false);
});

test("market clues, mismatched offers, and existing explicit assignments block automatic replacement", () => {
  const plan = planFixture([[300, 250]]);
  plan.creatives[0].languageClues = ["fi"];
  let result = buildMediaPlacementPlan(plan, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] });
  assert.ok(result.every((item) => item.state !== "AUTO_ASSIGN_DRAFT"));
  assert.ok(result.some((item) => item.marketHandling === "MARKET_SPECIFIC_REVIEW"));
  plan.creatives[0].languageClues = [];
  result = buildMediaPlacementPlan(plan, { bonus: { percentage: 200, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [] });
  assert.ok(result.filter((item) => item.subjectType === "CASINO_BONUS").every((item) => item.state === "REJECT"));
  result = buildMediaPlacementPlan(plan, { bonus: { percentage: 100, maximumBonus: null, currency: null, freeSpins: 50 }, existingAssignments: [{ id: "44444444-4444-4444-8444-444444444444", mediaAssetId: "55555555-5555-4555-8555-555555555555", subjectType: "CASINO_BONUS", subjectId: bonusId, placement: "BONUS_LISTING_CARD", variant: "DEFAULT", mediaAsset: { width: 300, height: 250 } }] });
  const protectedSlot = result.find((item) => item.placement === "BONUS_LISTING_CARD" && item.variant === "DEFAULT");
  assert.equal(protectedSlot?.state, "SUGGEST_REVIEW");
  assert.equal(protectedSlot?.replacementEligible, true);
  assert.equal(protectedSlot?.existingComparison, "EQUIVALENT");
});

test("Media Operations is a separate exact-resource MCP surface with only five bounded tools", () => {
  const config = resolveMediaMcpConfig("https://b4gamble.com/api/mcp/media", { MEDIA_OPERATIONS_MCP_ENABLED: "true", MEDIA_OPERATIONS_MCP_PUBLIC_ORIGIN: "https://b4gamble.com" });
  assert.ok(config);
  assert.equal(config.resource, "https://b4gamble.com/api/mcp/media");
  assert.deepEqual(mediaMcpProtectedResourceMetadata(config).scopes_supported, ["media:read", "media:safe_write", "offline_access"]);
  assert.deepEqual(mediaMcpTools.map((tool) => tool.name), ["media_ingest_partner_snippet", "media_analyze_and_plan", "media_apply_draft_plan", "media_get_plan", "media_list_recent_ingestions"]);
  assert.deepEqual(MEDIA_MCP_SCOPES, ["media:read", "media:safe_write"]);

  const staff = { id: "33333333-3333-4333-8333-333333333333", userId: "user-1", email: "staff@example.com", name: "Staff", role: "ADMIN" as const };
  const token = { id: "token", clientId: "client", userId: "user-1", sessionId: null, scopes: ["media:read"], resources: [config.resource], expiresAt: new Date("2099-01-01"), revoked: null, session: null, client: { disabled: false, tokenEndpointAuthMethod: "none", applicationType: "web", metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: config.resource } } };
  assert.equal(validateOperationalMcpTokenRecord(token, staff, config, "media:read").staff.id, staff.id);
  assert.throws(() => validateOperationalMcpTokenRecord({ ...token, resources: ["https://b4gamble.com/api/mcp/commercial"] }, staff, config, "media:read"), /wrong resource/);
  assert.throws(() => validateOperationalMcpTokenRecord({ ...token, scopes: ["commercial:read"] }, staff, config, "media:read"), /scope is not permitted/);
});

test("structural boundary contains no parser execution, publication, route creation, or destructive asset operation", () => {
  const parser = readFileSync(new URL("../lib/media-operations/parser.ts", import.meta.url), "utf8");
  assert.doesNotMatch(parser, /\beval\s*\(|new Function|DOMParser|dangerouslySetInnerHTML|document\./);
  const service = readFileSync(new URL("../lib/media-operations/service.ts", import.meta.url), "utf8");
  const repository = readFileSync(new URL("../lib/media-operations/repository.ts", import.meta.url), "utf8");
  const remoteFetch = readFileSync(new URL("../lib/media-operations/remote-image-fetch.ts", import.meta.url), "utf8");
  const semantic = readFileSync(new URL("../lib/media-operations/semantic-analysis.ts", import.meta.url), "utf8");
  assert.doesNotMatch(`${service}\n${repository}`, /publishCasino|createRedirect|trackingLink\.create|mediaAsset\.delete|prisma migrate reset/);
  assert.match(repository, /SUBJECT_NOT_DRAFT/);
  assert.match(repository, /CROP_SAFETY_REQUIRED/);
  assert.match(repository, /PLAN_OWNED_ASSIGNMENT_NOT_FOUND/);
  assert.match(repository, /ASSIGNMENT_CHANGED_SINCE_PLAN/);
  assert.match(repository, /source: "MEDIA_OPERATIONS"/);
  assert.match(service, /rawSnippetPersisted: false/);
  assert.match(service, /dedupeScope: "GLOBAL"/);
  const mediaService = readFileSync(new URL("../lib/services/media.service.ts", import.meta.url), "utf8");
  assert.match(mediaService, /media-ingestion\/by-checksum/);
  assert.match(mediaService, /racedDuplicate/);
  assert.match(remoteFetch, /method: "GET"/);
  assert.match(remoteFetch, /Accept-Encoding": "identity"/);
  assert.doesNotMatch(remoteFetch, /Cookie|Authorization/);
  assert.match(semantic, /store: false/);
  assert.match(semantic, /tools: \[\]/);
});
