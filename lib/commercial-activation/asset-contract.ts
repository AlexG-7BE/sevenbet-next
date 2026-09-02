import { z } from "zod";

export const COMMERCIAL_ASSET_MANIFEST_VERSION = "commercial-asset-manifest.v1" as const;

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const boundedText = z.string().trim().min(1).max(1_000);
const isoDate = z.string().datetime({ offset: true });

const assetSchema = z.object({
  sourcePath: z.string().trim().min(1).max(500).refine((value) => !value.startsWith("/") && !value.includes("\\") && !value.split("/").some((segment) => !segment || segment === "." || segment === ".."), "sourcePath must be a safe relative path"),
  creativeId: boundedText,
  sha256: z.string().trim().toLowerCase().regex(/^[a-f0-9]{64}$/),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  width: z.number().int().positive().max(8_000),
  height: z.number().int().positive().max(8_000),
  type: z.enum(["LOGO", "FAVICON", "HERO", "SCREENSHOT", "GALLERY", "BONUS_CREATIVE", "SOCIAL_IMAGE", "AFFILIATE_CREATIVE", "OTHER"]),
  altText: z.string().trim().max(300),
  title: z.string().trim().min(1).max(180).nullable().optional(),
  caption: z.string().trim().min(1).max(500).nullable().optional(),
  credit: z.string().trim().min(1).max(180).nullable().optional(),
  featured: z.boolean().default(false),
  casinoSlug: slug,
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()),
  languageCode: z.string().trim().min(2).max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).nullable().optional(),
  networkSlug: slug,
  externalProgramId: boundedText,
  externalOfferId: boundedText,
  publicationEvidence: z.object({
    status: z.literal("APPROVED_FOR_PUBLICATION"),
    sourceType: z.enum(["AFFILIATE_DASHBOARD", "PARTNER_CONFIRMATION", "EXTERNAL_DOCUMENT_REFERENCE"]),
    sourceReference: boundedText,
    observedAt: isoDate,
    verifiedAt: isoDate,
    expiresAt: isoDate.nullable().optional(),
    restrictions: z.string().trim().min(1).max(1_000).nullable().optional(),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.type !== "FAVICON" && !value.altText) context.addIssue({ code: "custom", path: ["altText"], message: "Alternative text is required" });
  if (new Date(value.publicationEvidence.observedAt) > new Date(value.publicationEvidence.verifiedAt)) {
    context.addIssue({ code: "custom", path: ["publicationEvidence", "observedAt"], message: "Observation cannot be later than verification" });
  }
  if (value.publicationEvidence.expiresAt && new Date(value.publicationEvidence.expiresAt) <= new Date(value.publicationEvidence.verifiedAt)) {
    context.addIssue({ code: "custom", path: ["publicationEvidence", "expiresAt"], message: "Publication expiry must be later than verification" });
  }
});

export const commercialAssetManifestSchema = z.object({
  schemaVersion: z.literal(COMMERCIAL_ASSET_MANIFEST_VERSION),
  manifestId: slug,
  activationBundleId: slug,
  generatedAt: z.string().datetime({ offset: true }),
  assets: z.array(assetSchema).min(1).max(500),
}).strict().superRefine((value, context) => {
  const identities = new Set<string>();
  for (const [index, asset] of value.assets.entries()) {
    const key = [asset.creativeId, asset.casinoSlug, asset.countryCode, asset.externalOfferId, asset.type].join("|");
    if (identities.has(key)) context.addIssue({ code: "custom", path: ["assets", index], message: "Duplicate manifest asset identity" });
    identities.add(key);
  }
});

export type CommercialAssetManifest = z.infer<typeof commercialAssetManifestSchema>;
export type CommercialAssetManifestItem = CommercialAssetManifest["assets"][number];

export function parseCommercialAssetManifest(value: unknown) {
  return commercialAssetManifestSchema.parse(value);
}
