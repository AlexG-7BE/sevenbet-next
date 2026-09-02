import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { parseCommercialAssetManifest } from "../lib/commercial-activation/asset-contract";
import { assertCommercialAssetPublicationAuthority, safeCommercialAssetSource } from "../lib/commercial-activation/asset-service";

function manifestValue() {
  return {
    schemaVersion: "commercial-asset-manifest.v1",
    manifestId: "founder-assets-2026-09-03",
    activationBundleId: "founder-portal-2026-09-03",
    generatedAt: "2026-09-03T10:00:00.000Z",
    assets: [{
      sourcePath: "verified/creative.png",
      creativeId: "creative-42",
      sha256: "a".repeat(64),
      mimeType: "image/png",
      width: 640,
      height: 320,
      type: "AFFILIATE_CREATIVE",
      altText: "Verified Casino Peru campaign creative",
      title: "Peru campaign creative",
      caption: null,
      credit: null,
      featured: false,
      casinoSlug: "verified-casino",
      countryCode: "PE",
      languageCode: "es-PE",
      networkSlug: "verified-network",
      externalProgramId: "program-42",
      externalOfferId: "offer-42",
      publicationEvidence: {
        status: "APPROVED_FOR_PUBLICATION",
        sourceType: "AFFILIATE_DASHBOARD",
        sourceReference: "Creative library item 42",
        observedAt: "2026-09-03T09:00:00.000Z",
        verifiedAt: "2026-09-03T10:00:00.000Z",
        expiresAt: "2026-12-31T00:00:00.000Z",
        restrictions: "PE and es-PE only",
      },
    }],
  };
}

test("manifest is exact Casino × GEO × offer and carries publication evidence", () => {
  const manifest = parseCommercialAssetManifest(manifestValue());
  assert.equal(manifest.assets[0].countryCode, "PE");
  assert.equal(manifest.assets[0].languageCode, "es-PE");
  assert.equal(manifest.assets[0].creativeId, "creative-42");
  assert.equal(manifest.assets[0].publicationEvidence.status, "APPROVED_FOR_PUBLICATION");
});

test("unsafe paths, duplicate creative identities, and invalid evidence chronology fail validation", () => {
  const unsafe = manifestValue();
  unsafe.assets[0].sourcePath = "../creative.png";
  assert.throws(() => parseCommercialAssetManifest(unsafe));

  const duplicate = manifestValue();
  duplicate.assets.push(structuredClone(duplicate.assets[0]));
  assert.throws(() => parseCommercialAssetManifest(duplicate));

  const chronology = manifestValue();
  chronology.assets[0].publicationEvidence.observedAt = "2026-09-03T11:00:00.000Z";
  assert.throws(() => parseCommercialAssetManifest(chronology));
});

test("publication authority fails closed when future-dated or expired", () => {
  const item = parseCommercialAssetManifest(manifestValue()).assets[0];
  assert.doesNotThrow(() => assertCommercialAssetPublicationAuthority(item, new Date("2026-09-03T12:00:00.000Z")));
  assert.throws(() => assertCommercialAssetPublicationAuthority(item, new Date("2027-01-01T00:00:00.000Z")), /ASSET_PUBLICATION_EVIDENCE_EXPIRED/);
  assert.throws(() => assertCommercialAssetPublicationAuthority(item, new Date("2026-09-03T08:00:00.000Z")), /ASSET_PUBLICATION_EVIDENCE_NOT_CURRENT/);
});

test("source resolution cannot escape its declared root", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "commercial-assets-"));
  const outside = await mkdtemp(path.join(tmpdir(), "commercial-assets-outside-"));
  try {
    await mkdir(path.join(root, "verified"));
    const bytes = Buffer.from("fixture");
    await writeFile(path.join(root, "verified", "creative.png"), bytes);
    await writeFile(path.join(outside, "creative.png"), bytes);
    const item = parseCommercialAssetManifest(manifestValue()).assets[0];
    assert.equal(await safeCommercialAssetSource(root, item), await realpath(path.join(root, "verified", "creative.png")));
    const escaped = { ...item, sourcePath: path.relative(root, path.join(outside, "creative.png")) };
    await assert.rejects(() => safeCommercialAssetSource(root, escaped), /ASSET_SOURCE_OUTSIDE_ROOT/);
    assert.equal(createHash("sha256").update(bytes).digest("hex").length, 64);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("asset adapter reuses MediaAsset integrity, exact ownership, deduplication, and all-before-upload preparation", () => {
  const source = readFileSync("lib/commercial-activation/asset-service.ts", "utf8");
  assert.match(source, /countries:\s*\{ where: \{ countryCode: item\.countryCode \}/);
  assert.match(source, /program: \{ network: \{ slug: item\.networkSlug \}, externalProgramId: item\.externalProgramId \}/);
  assert.match(source, /createHash\("sha256"\)/);
  assert.match(source, /validateMediaUpload/);
  assert.match(source, /processImage/);
  assert.match(source, /findDuplicateChecksum/);
  assert.match(source, /casinoCountryId: asset\.target\.casinoCountryId/);
  assert.ok(source.indexOf("for (const item of manifest.assets) prepared.push") < source.indexOf("for (const asset of prepared)"));
});
