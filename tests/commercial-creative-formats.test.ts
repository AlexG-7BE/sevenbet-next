import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";
import { deflateSync } from "node:zlib";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  assessCommercialCreative,
  commercialCreativeFormat,
  commercialCreativePresentationFamily,
  commercialCreativeFormats,
  commercialCreativeWeightWarning,
  creativePresentationFamily,
  creativePresentationGuidance,
} from "../lib/media/commercial-formats";
import { parseCommercialAssetManifest } from "../lib/commercial-activation/asset-contract";
import { MediaValidationError, validateMediaUpload } from "../lib/media/image-validation";
import { processImage } from "../lib/media/image-processing";
import type { PublicCasinoDTO, PublicPlacementMedia } from "../lib/public-casino/public-casino.types";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import { temporaryDemoBestOffers } from "../lib/demo-data/temporary-demo-best-offers";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import type { MediaRepository } from "../lib/repositories/media.repository";
import { MediaService } from "../lib/services/media.service";
import type { StorageProvider } from "../lib/media/storage";

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  output.write(type, 4, 4, "ascii");
  Buffer.from(data).copy(output, 8);
  output.writeUInt32BE(crc32(output.subarray(4, 8 + data.length)), 8 + data.length);
  return output;
}

function png(width: number, height: number) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function jpeg(width: number, height: number) {
  const output = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x08, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0xff, 0xd9,
  ]);
  output.writeUInt16BE(height, 7);
  output.writeUInt16BE(width, 9);
  return output;
}

function threeBitCodes(codes: number[]) {
  const output = Buffer.alloc(Math.ceil((codes.length * 3) / 8));
  codes.forEach((code, index) => {
    const bitOffset = index * 3;
    output[bitOffset >> 3] |= code << (bitOffset & 7);
    if ((bitOffset & 7) > 5) output[(bitOffset >> 3) + 1] |= code >> (8 - (bitOffset & 7));
  });
  return output;
}

function gifFrame(width: number, height: number) {
  const descriptor = Buffer.alloc(10);
  descriptor[0] = 0x2c;
  descriptor.writeUInt16LE(width, 5);
  descriptor.writeUInt16LE(height, 7);
  const codes: number[] = [];
  for (let pixel = 0; pixel < width * height; pixel += 1) codes.push(4, 0);
  codes.push(5);
  const compressed = threeBitCodes(codes);
  const blocks: Buffer[] = [descriptor, Buffer.from([2])];
  for (let offset = 0; offset < compressed.length; offset += 255) {
    const chunk = compressed.subarray(offset, offset + 255);
    blocks.push(Buffer.from([chunk.length]), chunk);
  }
  blocks.push(Buffer.from([0]));
  return Buffer.concat(blocks);
}

function gif(width: number, height: number, frames = 1) {
  const header = Buffer.alloc(13);
  header.write("GIF89a", 0, "ascii");
  header.writeUInt16LE(width, 6);
  header.writeUInt16LE(height, 8);
  header[10] = 0x80;
  return Buffer.concat([
    header,
    Buffer.from([0, 0, 0, 255, 255, 255]),
    ...Array.from({ length: frames }, () => gifFrame(width, height)),
    Buffer.from([0x3b]),
  ]);
}

function expectCode(callback: () => unknown, code: string) {
  assert.throws(callback, (error: unknown) => error instanceof MediaValidationError && error.code === code);
}

test("the deterministic format registry covers core, mobile, wide, inventory, and compatibility formats", () => {
  const dimensions = commercialCreativeFormats.map((entry) => `${entry.width}x${entry.height}`);
  for (const expected of ["300x250", "250x250", "320x100", "320x50", "728x90", "160x600", "300x600", "970x250", "970x90", "336x280", "468x60", "120x600"]) {
    assert.ok(dimensions.includes(expected), expected);
  }
  assert.equal(commercialCreativeFormat(300, 250)?.id, "MEDIUM_RECTANGLE_300_250");
  assert.equal(commercialCreativeFormat(251, 250), null);
  assert.equal(commercialCreativePresentationFamily(300, 250), "CARD");
  assert.equal(commercialCreativePresentationFamily(250, 250), "CARD");
  assert.equal(commercialCreativePresentationFamily(336, 280), "CARD");
  assert.equal(commercialCreativePresentationFamily(320, 100), "MOBILE_LANDSCAPE");
  assert.equal(commercialCreativePresentationFamily(300, 100), "MOBILE_LANDSCAPE");
  assert.equal(commercialCreativePresentationFamily(320, 50), "STRIP");
  assert.equal(commercialCreativePresentationFamily(300, 50), "STRIP");
  assert.equal(commercialCreativePresentationFamily(468, 60), "STRIP");
  assert.equal(commercialCreativePresentationFamily(728, 90), "WIDE");
  assert.equal(commercialCreativePresentationFamily(970, 90), "WIDE");
  assert.equal(commercialCreativePresentationFamily(970, 250), "WIDE");
  assert.equal(commercialCreativePresentationFamily(160, 600), "PORTRAIT_INVENTORY");
  assert.equal(creativePresentationFamily({ placement: "CASINO_DETAIL_HERO", width: 1600, height: 900 }), "BRAND_ART");
  assert.equal(creativePresentationFamily({ placement: "CASINO_DETAIL_HERO", mediaType: "LOGO", width: 250, height: 250 }), "LOGO_ONLY");
  assert.match(creativePresentationGuidance({ family: "STRIP", placement: "BONUS_LISTING_CARD" }), /compact horizontal banner/i);
  assert.match(creativePresentationGuidance({ family: "CARD", placement: "CASINO_DETAIL_HERO" }), /not enlarged as review hero art/i);
  assert.equal(assessCommercialCreative({ placement: "BONUS_LISTING_CARD", variant: "DEFAULT", width: 300, height: 250 }).state, "PREFERRED");
  assert.equal(assessCommercialCreative({ placement: "BONUS_LISTING_CARD", variant: "DEFAULT", width: 250, height: 250 }).state, "COMPATIBLE");
  assert.equal(assessCommercialCreative({ placement: "BONUS_LISTING_CARD", variant: "MOBILE", width: 320, height: 50 }).state, "PREFERRED");
  assert.equal(assessCommercialCreative({ placement: "BONUS_LISTING_CARD", variant: "DEFAULT", width: 320, height: 50 }).state, "POOR_FIT");
  assert.equal(assessCommercialCreative({ placement: "CASINO_OFFER_BLOCK", variant: "DEFAULT", width: 728, height: 90 }).state, "PREFERRED");
  assert.equal(assessCommercialCreative({ placement: "BEST_OFFER_FEATURED", variant: "DEFAULT", width: 728, height: 90 }).state, "POOR_FIT");
  assert.equal(assessCommercialCreative({ placement: "OFFER_DETAIL", variant: "DEFAULT", width: 728, height: 90 }).state, "COMPATIBLE");
  assert.equal(assessCommercialCreative({ placement: "BEST_OFFER_SECONDARY", variant: "DEFAULT", width: 411, height: 97 }).state, "UNRECOGNIZED");
  assert.equal(commercialCreativeWeightWarning(1024 * 1024), null);
  assert.match(commercialCreativeWeightWarning(1024 * 1024 + 1) ?? "", /Heavy creative/);
});

test("commercial upload acceptance is separate from placement compatibility", () => {
  const fixtures = [
    [jpeg(300, 250), "creative-300x250.jpg", "image/jpeg", 300, 250],
    [jpeg(250, 250), "creative-250x250.jpg", "image/jpeg", 250, 250],
    [png(250, 250), "creative-250x250.png", "image/png", 250, 250],
    [gif(300, 250), "creative-300x250.gif", "image/gif", 300, 250],
    [gif(320, 50), "creative-320x50.gif", "image/gif", 320, 50],
    [png(320, 100), "creative-320x100.png", "image/png", 320, 100],
    [jpeg(728, 90), "creative-728x90.jpg", "image/jpeg", 728, 90],
    [png(160, 600), "creative-160x600.png", "image/png", 160, 600],
    [png(300, 600), "creative-300x600.png", "image/png", 300, 600],
  ] as const;
  for (const [data, filename, declaredMimeType, width, height] of fixtures) {
    for (const type of ["BONUS_CREATIVE", "AFFILIATE_CREATIVE"] as const) {
      const result = validateMediaUpload({ data, filename, declaredMimeType, type });
      assert.deepEqual([result.width, result.height], [width, height], `${type}:${filename}`);
    }
  }
});

test("GIF validation reads signature, dimensions, frames, and rejects spoofed or malformed data", async () => {
  const animation = gif(320, 50, 2);
  const validated = validateMediaUpload({ data: animation, filename: "mobile.gif", declaredMimeType: "image/gif", type: "BONUS_CREATIVE" });
  assert.equal(validated.mimeType, "image/gif");
  assert.equal(validated.animated, true);
  assert.equal("frameCount" in validated ? validated.frameCount : 0, 2);

  let variantProcessorCalled = false;
  const processed = await processImage({
    data: animation,
    mimeType: "image/gif",
    variantProcessor: { createVariants: async () => { variantProcessorCalled = true; return []; } },
  });
  assert.deepEqual(processed.original, animation);
  assert.equal(processed.metadataStripped, false);
  assert.equal(variantProcessorCalled, false);
  assert.deepEqual(processed.variants, []);

  expectCode(() => validateMediaUpload({ data: animation.subarray(0, -1), filename: "mobile.gif", declaredMimeType: "image/gif", type: "BONUS_CREATIVE" }), "INVALID_IMAGE");
  const malformedControlExtension = Buffer.concat([animation.subarray(0, 19), Buffer.from([0x21, 0xf9, 0x01, 0x00, 0x00]), animation.subarray(19)]);
  expectCode(() => validateMediaUpload({ data: malformedControlExtension, filename: "mobile.gif", declaredMimeType: "image/gif", type: "BONUS_CREATIVE" }), "INVALID_IMAGE");
  expectCode(() => validateMediaUpload({ data: animation, filename: "mobile.gif", declaredMimeType: "image/png", type: "BONUS_CREATIVE" }), "MIME_MISMATCH");
  expectCode(() => validateMediaUpload({ data: animation, filename: "mobile.png", declaredMimeType: "image/gif", type: "BONUS_CREATIVE" }), "EXTENSION_MISMATCH");
  expectCode(() => validateMediaUpload({ data: Buffer.from("<svg><script/></svg>"), filename: "creative.svg", declaredMimeType: "image/svg+xml", type: "BONUS_CREATIVE" }), "SVG_REJECTED");
  expectCode(() => validateMediaUpload({ data: animation, filename: "mobile.gif", declaredMimeType: "image/gif", type: "BONUS_CREATIVE", maxSizeBytes: 8 }), "FILE_TOO_LARGE");
});

test("the current controlled Slotnite 320×50 GIF is accepted without replacing its animation", async () => {
  const source = readFileSync("public/casino-brands/slotnite/partner-brand.gif");
  const validated = validateMediaUpload({ data: source, filename: "partner-brand.gif", declaredMimeType: "image/gif", type: "BONUS_CREATIVE" });
  assert.deepEqual([validated.width, validated.height, validated.animated], [320, 50, true]);
  assert.ok("frameCount" in validated && validated.frameCount > 1);
  const processed = await processImage({ data: source, mimeType: "image/gif" });
  assert.deepEqual(processed.original, source);
});

test("the media service persists detected GIF metadata and the original animated bytes", async () => {
  const animation = gif(320, 50, 2);
  let createInput: Record<string, unknown> | null = null;
  let uploaded: { data: Uint8Array; contentType: string } | null = null;
  const repository = {
    resolveOwnership: async () => ({ casino: { id: "11111111-1111-4111-8111-111111111111" }, casinoBonus: { id: "22222222-2222-4222-8222-222222222222", casinoId: "11111111-1111-4111-8111-111111111111" }, affiliateOffer: null }),
    findDuplicateChecksum: async () => null,
    nextSortOrder: async () => 1000,
    create: async (input: Record<string, unknown>) => { createInput = input; return input; },
  } as unknown as MediaRepository;
  const provider: StorageProvider = {
    name: "LOCAL",
    validate: async () => undefined,
    upload: async ({ key, data, contentType }) => { uploaded = { data, contentType }; return { key, publicUrl: `/api/media/local/${key}`, created: true }; },
    delete: async () => undefined,
    getPublicUrl: (key) => `/api/media/local/${key}`,
    exists: async () => false,
    metadata: async () => null,
  };
  const service = new MediaService(repository, () => provider);
  await service.upload({
    file: { name: "slotnite-320x50.gif", type: "image/gif", size: animation.length, arrayBuffer: async () => animation.buffer.slice(animation.byteOffset, animation.byteOffset + animation.byteLength) as ArrayBuffer },
    type: "BONUS_CREATIVE",
    altText: "Slotnite current bonus creative",
    casinoId: "11111111-1111-4111-8111-111111111111",
    casinoBonusId: "22222222-2222-4222-8222-222222222222",
    actorId: "33333333-3333-4333-8333-333333333333",
  });
  const recordedUpload = uploaded as { data: Uint8Array; contentType: string } | null;
  const recordedCreate = createInput as Record<string, unknown> | null;
  assert.ok(recordedUpload);
  assert.equal(recordedUpload.contentType, "image/gif");
  assert.deepEqual(recordedUpload.data, animation);
  assert.ok(recordedCreate);
  assert.equal(recordedCreate.mimeType, "image/gif");
  assert.equal(recordedCreate.width, 320);
  assert.equal(recordedCreate.height, 50);
  assert.equal(recordedCreate.sizeBytes, animation.length);
  assert.deepEqual(recordedCreate.variants, []);
  assert.deepEqual(recordedCreate.metadata, {
    metadataStripped: false,
    sourceSizeBytes: animation.length,
    detectedMimeType: "image/gif",
    detectedWidth: 320,
    detectedHeight: 50,
    animated: true,
    animationFrameCount: 2,
  });
});

test("governed batch ingestion and local media serving retain the validated GIF MIME", () => {
  const manifest = parseCommercialAssetManifest({
    schemaVersion: "commercial-asset-manifest.v1",
    manifestId: "creative-formats-gif",
    activationBundleId: "creative-formats-gif-bundle",
    generatedAt: "2026-09-04T12:00:00.000Z",
    assets: [{
      sourcePath: "verified/creative.gif",
      creativeId: "slotnite-mobile-gif",
      sha256: "a".repeat(64),
      mimeType: "image/gif",
      width: 320,
      height: 50,
      type: "BONUS_CREATIVE",
      altText: "Slotnite mobile offer creative",
      featured: false,
      casinoSlug: "slotnite",
      countryCode: "GB",
      languageCode: "en-GB",
      networkSlug: "verified-network",
      externalProgramId: "verified-program",
      externalOfferId: "verified-offer",
      publicationEvidence: {
        status: "APPROVED_FOR_PUBLICATION",
        sourceType: "AFFILIATE_DASHBOARD",
        sourceReference: "Controlled creative library evidence",
        observedAt: "2026-09-04T11:00:00.000Z",
        verifiedAt: "2026-09-04T12:00:00.000Z",
      },
    }],
  });
  assert.equal(manifest.assets[0].mimeType, "image/gif");
  assert.match(readFileSync("app/api/media/local/[...key]/route.ts", "utf8"), /gif:\s*"image\/gif"/);
});

function placementMedia(
  placement: "BONUS_LISTING_CARD" | "BEST_OFFER_FEATURED" | "BEST_OFFER_SECONDARY" | "CASINO_DETAIL_HERO" | "CASINO_OFFER_BLOCK",
  url = "/api/media/local/creative.gif",
  renderingMode: "CONTAIN" | "COVER" | "COMPOSED" = "CONTAIN",
  dimensions = { width: 300, height: 250 },
): PublicPlacementMedia {
  const asset = { id: "creative", type: "other" as const, url, alt: "Current verified offer creative", ...dimensions, caption: null };
  const resolution = {
    asset,
    assignmentId: "assignment",
    requestedPlacement: placement,
    resolvedPlacement: placement,
    requestedVariant: "DEFAULT" as const,
    resolvedVariant: "DEFAULT" as const,
    requestedCountryCode: null,
    requestedLanguageCode: null,
    resolvedCountryCode: null,
    resolvedLanguageCode: null,
    targetingResolution: "GLOBAL_NEUTRAL" as const,
    renderingMode,
    source: "EXPLICIT" as const,
    fallback: false,
    effectiveAlt: asset.alt,
    focalPoint: null,
  };
  return { ...resolution, variants: { DEFAULT: resolution } };
}

function profileCasino(renderingMode: "CONTAIN" | "COVER" | "COMPOSED" = "CONTAIN"): PublicCasinoDTO {
  const placement = placementMedia("CASINO_DETAIL_HERO", "/controlled/skol-300x250.jpg", renderingMode);
  const offerPlacement = placementMedia("CASINO_OFFER_BLOCK", "/controlled/skol-300x250.jpg", renderingMode);
  return {
    source: "cms", id: "skol-id", slug: "skol-casino", name: "Skol Casino", title: "Skol Casino",
    domain: "operator.example", summary: "Published factual summary.", reviewContent: "Published editorial review.", operator: "Skol Operator",
    foundedYear: 2020, editorScore: 8.7, trustScore: 8.1, featured: true, recommended: true,
    publishedAt: "2030-01-01T00:00:00.000Z", lastReviewedAt: "2030-02-03T00:00:00.000Z", version: 3,
    languages: ["en"], currencies: ["GBP"], pros: ["Published strength"], cons: ["Published limitation"], responsibleGamblingTools: ["Deposit limits"],
    seo: { title: "Skol review", description: "Published metadata.", canonical: "https://b4gamble.com/casino/skol-casino", robots: "index,follow", socialTitle: "Skol review", socialDescription: "Published metadata.", socialImage: null, structuredData: null },
    licenses: [{ authority: "Published Authority", licenseNumber: null, jurisdiction: "GB", status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: "2030-01-15T00:00:00.000Z" }],
    countries: [{ countryCode: "GB", availability: "AVAILABLE", minimumAge: 18, currency: "GBP", language: "en" }],
    payments: [], providers: [], categories: [], marketProfiles: [],
    bonuses: [{
      id: "bonus-id", slug: "skol-welcome", title: "Verified Skol welcome offer", summary: "Current published offer", type: "WELCOME", percentage: 100,
      minimumDeposit: 10, maximumBonus: 150, maximumBet: 5, currency: "GBP", freeSpins: 20, wageringMultiplier: 30,
      wageringText: "30× wagering", eligibility: "New eligible customers only", importantConditions: ["Terms apply"], termsUrl: null,
      startsAt: null, expiresAt: null, affiliate: { href: "/r/skol-current-offer", available: true },
      media: { CASINO_OFFER_BLOCK: offerPlacement },
    }],
    media: { logo: null, hero: placement.asset, screenshots: [], gallery: [], socialImage: null, placements: { CASINO_DETAIL_HERO: placement } },
    affiliate: { href: "/r/skol-casino", available: true },
    presentationDisposition: "PROMOTABLE",
    presentationDispositionReason: "EXACT_MARKET_AND_ROUTE_ELIGIBLE",
  };
}

test("authorized creative markup uses the governed route while blocked creative stays non-interactive", async () => {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = () => undefined;
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CommercialOfferMedia } = await import("../components/commercial-media/CommercialOfferMedia");
  const { CasinoOutboundAction } = await import("../components/casino-profile/CasinoOutboundAction");
  const messages = productPageMessages("en-GB");
  const seed = temporaryDemoBestOffers()[0];
  const placement = placementMedia("BONUS_LISTING_CARD", "/api/media/local/slotnite-300x250.gif");
  const available: PublicOfferDTO = {
    ...seed,
    dataClassification: "PUBLISHED_RECORD",
    commercialAvailability: "AVAILABLE",
    action: { available: true, href: "/r/slotnite-current-offer" },
    bonus: { ...seed.bonus, media: { ...seed.bonus.media, BONUS_LISTING_CARD: placement } },
  };
  const creative = renderToStaticMarkup(React.createElement(CommercialOfferMedia, { messages, offer: available, variant: "bonus" }));
  const cta = renderToStaticMarkup(React.createElement(CasinoOutboundAction, { action: { href: available.action.href!, label: messages.common.actionAvailable }, context: { source: "CTA", placement: "BONUS_LISTING_CARD" }, messages: messages.outbound }));
  assert.match(creative, /data-commercial-action-source="CREATIVE"/);
  assert.match(creative, /data-commercial-action-placement="BONUS_LISTING_CARD"/);
  assert.match(creative, /href="\/outbound\/slotnite-current-offer"/);
  assert.match(cta, /href="\/outbound\/slotnite-current-offer"/);
  assert.match(cta, /data-commercial-action-placement="BONUS_LISTING_CARD"/);
  assert.match(creative, new RegExp(`${available.casino.name}[^<]*—[^<]*${available.bonus.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(creative, /<a[^>]+data-commercial-action-source="CREATIVE"[^>]*>[\s\S]*?<figure[\s\S]*?<\/figure><\/a>/);
  assert.doesNotMatch(creative, /go\.superflypartners\.net|record\.[^\s"']+|betsson[^\s"']*tracker/i);

  const stripPlacement = placementMedia("BONUS_LISTING_CARD", "/casino-brands/slotnite/partner-brand.gif", "COMPOSED", { width: 320, height: 50 });
  const stripOffer: PublicOfferDTO = { ...available, bonus: { ...available.bonus, media: { BONUS_LISTING_CARD: stripPlacement } } };
  const stripCreative = renderToStaticMarkup(React.createElement(CommercialOfferMedia, { messages, offer: stripOffer, variant: "bonus" }));
  assert.match(stripCreative, /data-presentation-family="STRIP"/);
  assert.match(stripCreative, /data-creative-scale-cap="1"/);
  assert.match(stripCreative, /src="\/casino-brands\/slotnite\/partner-brand\.gif"/);
  const stripFigure = stripCreative.match(/<figure[\s\S]*?<\/figure>/)?.[0] ?? "";
  assert.doesNotMatch(stripFigure, /100% up to|compositionIdentity|controlledStrip/i);

  const blocked: PublicOfferDTO = { ...available, commercialAvailability: "UNAVAILABLE", action: { available: false, href: null } };
  const blockedCreative = renderToStaticMarkup(React.createElement(CommercialOfferMedia, { messages, offer: blocked, variant: "bonus" }));
  assert.match(blockedCreative, /data-media-state="presented"/);
  assert.doesNotMatch(blockedCreative, /data-commercial-action-source="CREATIVE"|href="\/outbound\/|href="\/r\//);
});

test("review heroes stay inert while promotional formats move to the governed Casino offer block", async () => {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = () => undefined;
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const messages = productPageMessages("en-GB");
  const presentation = resolvePresentationContext({});

  for (const renderingMode of ["CONTAIN", "COVER", "COMPOSED"] as const) {
    const html = renderToStaticMarkup(React.createElement(CasinoProfile, {
      availableForPresentation: true,
      casino: profileCasino(renderingMode),
      editorial: null,
      messages,
      presentation,
    }));
    assert.match(html, /<aside[^>]+data-media-mode="COMPOSED"[^>]+data-presentation-family="LOGO_ONLY"[^>]+data-suppressed-promotion-family="CARD"/);
    assert.doesNotMatch(html, /data-commercial-action-placement="CASINO_DETAIL_HERO"/);
    assert.match(html, /data-commercial-action-placement="CASINO_OFFER_BLOCK" data-commercial-action-source="CREATIVE"[^>]+data-commercial-media-variant="casino-offer"[^>]+href="\/outbound\/skol-current-offer"/);
    assert.match(html, /data-presentation-family="CARD"/);
    assert.match(html, /data-commercial-action-source="CTA"[^>]+href="\/outbound\/skol-current-offer"/);
    assert.doesNotMatch(html, /href="https?:\/\/operator\.example/);
  }

  const blockedCasino = profileCasino();
  blockedCasino.bonuses = blockedCasino.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } }));
  blockedCasino.affiliate = { href: null, available: false };
  const blocked = renderToStaticMarkup(React.createElement(CasinoProfile, { availableForPresentation: true, casino: blockedCasino, editorial: null, messages, presentation }));
  assert.match(blocked, /src="\/controlled\/skol-300x250\.jpg"/);
  assert.doesNotMatch(blocked, /data-commercial-action-source="CREATIVE"|href="\/outbound\/|href="\/r\//);

  const brandOnly = profileCasino();
  brandOnly.media = { ...brandOnly.media, hero: null, placements: undefined, logo: { id: "skol-logo", type: "logo", url: "/controlled/skol-logo.png", alt: "Skol logo", width: 200, height: 100, caption: null } };
  const fallback = renderToStaticMarkup(React.createElement(CasinoProfile, { availableForPresentation: true, casino: brandOnly, editorial: null, messages, presentation }));
  assert.match(fallback, /data-media-ratio="brand"/);
  assert.doesNotMatch(fallback, /data-commercial-action-placement="CASINO_DETAIL_HERO"/);

  const brandArtCasino = profileCasino();
  const brandArt = { id: "brand-art", type: "hero" as const, url: "/controlled/skol-brand-art.jpg", alt: "Skol operator artwork", width: 1600, height: 900, caption: null };
  const brandArtPlacement = placementMedia("CASINO_DETAIL_HERO", brandArt.url, "COVER", { width: 1600, height: 900 });
  brandArtPlacement.asset = brandArt;
  brandArtCasino.media = { ...brandArtCasino.media, hero: brandArt, placements: { ...brandArtCasino.media.placements, CASINO_DETAIL_HERO: brandArtPlacement } };
  const brandArtHtml = renderToStaticMarkup(React.createElement(CasinoProfile, { availableForPresentation: true, casino: brandArtCasino, editorial: null, messages, presentation }));
  assert.match(brandArtHtml, /<aside[^>]+data-media-mode="COVER"[^>]+data-presentation-family="BRAND_ART"/);
  assert.match(brandArtHtml, /src="\/controlled\/skol-brand-art\.jpg"/);
  assert.doesNotMatch(brandArtHtml, /data-commercial-action-placement="CASINO_DETAIL_HERO"/);

  const logoOfferCasino = profileCasino();
  const logoOffer = placementMedia("CASINO_OFFER_BLOCK", "/controlled/skol-logo.png", "COMPOSED", { width: 250, height: 250 });
  logoOffer.asset = { ...logoOffer.asset!, type: "logo" };
  logoOffer.source = "LOGO_COMPOSITION";
  logoOfferCasino.bonuses = logoOfferCasino.bonuses.map((entry) => ({ ...entry, media: { CASINO_OFFER_BLOCK: logoOffer } }));
  const logoOfferHtml = renderToStaticMarkup(React.createElement(CasinoProfile, { availableForPresentation: true, casino: logoOfferCasino, editorial: null, messages, presentation }));
  assert.match(logoOfferHtml, /data-presentation-family="LOGO_ONLY"/);
  assert.doesNotMatch(logoOfferHtml, /data-commercial-action-placement="CASINO_OFFER_BLOCK" data-commercial-action-source="CREATIVE"/);
});

test("Admin and public components keep one format contract and no raw partner embed path", () => {
  const editor = readFileSync("components/admin/media/PlacementMediaEditor.tsx", "utf8");
  const selector = readFileSync("components/admin/media/MediaSelector.tsx", "utf8");
  const commercial = readFileSync("components/commercial-media/CommercialOfferMedia.tsx", "utf8");
  const commercialStyles = readFileSync("components/commercial-media/CommercialOfferMedia.module.css", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  assert.match(editor, /assessCommercialCreative/);
  assert.match(editor, /image\/gif/);
  assert.match(editor, /Valid unusual images remain assignable with a warning/);
  assert.match(selector, /image\/gif/);
  assert.match(commercial, /GovernedCommercialAction/);
  assert.match(editor, /Expected presentation/);
  assert.match(editor, /creativePresentationGuidance/);
  assert.match(commercialStyles, /\.frame\[data-presentation-family="CARD"\]/);
  assert.match(commercialStyles, /\.frame\[data-presentation-family="STRIP"\] \.mediaStage \{ height:78px/);
  assert.match(commercialStyles, /\.frame\[data-offer-media\]\[data-mobile-presentation-family="MOBILE_LANDSCAPE"\]/);
  assert.match(commercialStyles, /\.mediaArtwork \{ width:auto; height:auto; max-width:100%; max-height:100%/);
  assert.doesNotMatch(commercial, /compositionIdentity|controlledStrip/);
  assert.match(profile, /placement: "CASINO_OFFER_BLOCK"/);
  assert.doesNotMatch(profile, /context=\{\{ source: "CREATIVE", placement: "CASINO_DETAIL_HERO" \}\}/);
  for (const source of [commercial, profile]) {
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|<iframe|partnerClickUrl|impression(?:Pixel|Url)/i);
  }
});
