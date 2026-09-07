import { createHash } from "node:crypto";
import { isIP } from "node:net";

import { isPublicAddress } from "@/lib/affiliate-health/public-network-url";
import type { MediaIngestionContextInput, MediaIngestPartnerBatchItem } from "@/lib/media-operations/contracts";
import { decodeHtmlEntities, safeUrlEvidence, type SafeUrlEvidence } from "@/lib/media-operations/parser";

export const vettedPartnerProviders = ["SUPERFLY", "BANNERFLOW"] as const;
export const partnerCreativeSourceModes = ["PARTNER_HOSTED_IMAGE", "PARTNER_HOSTED_EMBED"] as const;
export const partnerCreativeLanguageStates = ["EXPLICIT", "NEUTRAL", "UNKNOWN"] as const;

export type VettedPartnerProvider = (typeof vettedPartnerProviders)[number];
export type PartnerCreativeSourceMode = (typeof partnerCreativeSourceModes)[number];
export type PartnerCreativeLanguageState = (typeof partnerCreativeLanguageStates)[number];

export class PartnerHostedCreativeParseError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "PartnerHostedCreativeParseError";
  }
}

export interface ParsedPartnerDescription {
  raw: string | null;
  externalLabel: string | null;
  brandLabel: string | null;
  countryName: string | null;
  countryCode: string | null;
  purpose: string | null;
  width: number | null;
  height: number | null;
  dimensionProvenance: "EXPLICIT_PARTNER_METADATA" | "NORMALIZED_SOURCE_FIELD" | "TITLE_PATTERN" | "DESCRIPTION_PATTERN" | null;
  languageCode: string | null;
  languageState: PartnerCreativeLanguageState;
  currencyCode: string | null;
  contradiction: string | null;
}

export interface ParsedPartnerHostedCreative {
  provider: VettedPartnerProvider;
  sourceMode: PartnerCreativeSourceMode;
  providerIdentityKey: string;
  externalCreativeId: string;
  affiliateId: string | null;
  campaignId: string | null;
  adGroupId: string | null;
  did: string | null;
  mediaId: string | null;
  operatorProgramId: string | null;
  declaredWidth: number;
  declaredHeight: number;
  dimensionProvenance: "EXPLICIT_PARTNER_METADATA" | "NORMALIZED_SOURCE_FIELD" | "TITLE_PATTERN" | "DESCRIPTION_PATTERN" | "PROVIDER_METADATA";
  altText: string | null;
  hostedImageUrl: string | null;
  providerEmbedPath: string | null;
  providerEmbedParameters: Record<string, string> | null;
  destinationUrl: string;
  destinationUrlHash: string;
  destinationHost: string;
  sourceChecksum: string;
  sourceEvidence: SafeUrlEvidence;
  destinationEvidence: SafeUrlEvidence;
  description: ParsedPartnerDescription;
}

export function applyPartnerHostedTargetingContext(
  creative: ParsedPartnerHostedCreative,
  context: Pick<MediaIngestionContextInput, "targetCountryCodes" | "creativeLanguage" | "creativeLanguageState">,
) {
  const description = { ...creative.description };
  const notes: string[] = [];
  const targetCountries = context.targetCountryCodes ?? [];

  if (!description.contradiction && targetCountries.length) {
    if (description.countryCode && !targetCountries.includes(description.countryCode)) {
      throw new PartnerHostedCreativeParseError(
        "Provider country metadata conflicts with the explicit target country context.",
        "HOSTED_TARGET_COUNTRY_CONTRADICTION",
      );
    }
    if (!description.countryCode && targetCountries.length > 1) {
      throw new PartnerHostedCreativeParseError(
        "One hosted creative without provider country metadata cannot be assigned to multiple target countries.",
        "HOSTED_TARGET_COUNTRY_AMBIGUOUS",
      );
    }
    if (!description.countryCode && targetCountries.length === 1) {
      description.countryCode = targetCountries[0];
      notes.push(`HOSTED_COUNTRY_FROM_EXPLICIT_TARGET_CONTEXT:${targetCountries[0]}`);
    }
  }

  const requestedLanguageState = context.creativeLanguageState ?? "UNKNOWN";
  if (requestedLanguageState === "EXPLICIT") {
    if (!context.creativeLanguage) {
      throw new PartnerHostedCreativeParseError(
        "Explicit hosted creative language context requires a language code.",
        "HOSTED_TARGET_LANGUAGE_INVALID",
      );
    }
    if (description.languageCode && description.languageCode !== context.creativeLanguage) {
      throw new PartnerHostedCreativeParseError(
        "Provider language metadata conflicts with the explicit creative language context.",
        "HOSTED_TARGET_LANGUAGE_CONTRADICTION",
      );
    }
    if (!description.languageCode) {
      description.languageCode = context.creativeLanguage;
      description.languageState = "EXPLICIT";
      notes.push(`HOSTED_LANGUAGE_FROM_EXPLICIT_TARGET_CONTEXT:${context.creativeLanguage}`);
    }
  } else if (requestedLanguageState === "NEUTRAL") {
    if (description.languageCode || description.languageState === "EXPLICIT") {
      throw new PartnerHostedCreativeParseError(
        "Provider language metadata conflicts with neutral creative language context.",
        "HOSTED_TARGET_LANGUAGE_CONTRADICTION",
      );
    }
    description.languageCode = null;
    description.languageState = "NEUTRAL";
    notes.push("HOSTED_LANGUAGE_FROM_EXPLICIT_TARGET_CONTEXT:NEUTRAL");
  }

  return { creative: { ...creative, description }, notes };
}

const countryNames: Readonly<Record<string, string>> = {
  argentina: "AR", australia: "AU", austria: "AT", belgium: "BE", brazil: "BR",
  canada: "CA", chile: "CL", colombia: "CO", denmark: "DK", estonia: "EE",
  finland: "FI", france: "FR", germany: "DE", ireland: "IE", italy: "IT",
  latvia: "LV", lithuania: "LT", mexico: "MX", netherlands: "NL", norway: "NO",
  peru: "PE", poland: "PL", portugal: "PT", spain: "ES", sweden: "SE",
  "united kingdom": "GB", uk: "GB", "great britain": "GB",
};
const supportedCountryCodes = new Set(Object.values(countryNames));

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function unwrapMarkdown(value: string) {
  let result = value.trim();
  const fullFence = result.match(/^```(?:html|text)?\s*\n([\s\S]*?)\n```$/i);
  if (fullFence) result = fullFence[1].trim();
  return result.replace(/```(?:html|text)?\s*/gi, "").replace(/```/g, "").trim();
}

export function splitPartnerCreativeInput(value: string) {
  const input = unwrapMarkdown(value.replace(/\r\n?/g, "\n"));
  const descriptionMarker = /^\s*Description\s*:\s*/im.exec(input);
  const embedMarker = /^\s*Embed Code\s*:\s*/im.exec(input);
  if (!embedMarker) return { description: null, embedCode: input };
  const embedStart = embedMarker.index + embedMarker[0].length;
  const description = descriptionMarker && descriptionMarker.index < embedMarker.index
    ? input.slice(descriptionMarker.index + descriptionMarker[0].length, embedMarker.index).trim()
    : null;
  return {
    description: description || null,
    embedCode: unwrapMarkdown(input.slice(embedStart)),
  };
}

function positiveDimension(value: string | undefined) {
  if (!value || !/^\d{1,5}$/.test(value)) return null;
  const number = Number(value);
  return number > 0 && number <= 10_000 ? number : null;
}

function clean(value: string | null | undefined, maximum = 500) {
  const result = value?.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return result ? result.slice(0, maximum) : null;
}

type PartnerItemMetadata = Pick<MediaIngestPartnerBatchItem,
  "declaredWidth" | "declaredHeight" | "dimensionProvenance" | "title" | "description" | "providerReference"
>;

function textDimensions(value: string | null | undefined) {
  const dimensions = value?.match(/\b(\d{2,5})\s*[x×]\s*(\d{2,5})\b/i);
  const width = positiveDimension(dimensions?.[1]);
  const height = positiveDimension(dimensions?.[2]);
  return width && height ? { width, height } : null;
}

export function parsePartnerDescription(value: string | null, metadata: Partial<PartnerItemMetadata> = {}): ParsedPartnerDescription {
  const compositeDescription = clean(value, 2_000);
  const raw = clean([metadata.title, metadata.description, compositeDescription].filter(Boolean).join(" - "), 2_000);
  const structuredDimensions = metadata.declaredWidth && metadata.declaredHeight
    ? { width: metadata.declaredWidth, height: metadata.declaredHeight }
    : null;
  const titleDimensions = textDimensions(metadata.title);
  const descriptionDimensions = textDimensions(metadata.description ?? compositeDescription);
  const dimensions = structuredDimensions ?? titleDimensions ?? descriptionDimensions;
  const dimensionProvenance = structuredDimensions
    ? metadata.dimensionProvenance ?? "EXPLICIT_PARTNER_METADATA"
    : titleDimensions ? "TITLE_PATTERN" as const
      : descriptionDimensions ? "DESCRIPTION_PATTERN" as const : null;
  if (!raw) return {
    raw: null, externalLabel: null, brandLabel: null, countryName: null, countryCode: null,
    purpose: null, width: dimensions?.width ?? null, height: dimensions?.height ?? null, dimensionProvenance, languageCode: null, languageState: "UNKNOWN",
    currencyCode: null, contradiction: null,
  };
  const parts = raw.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  const externalLabel = parts.find((part) => /^(?:studio|creative|banner|ad)[_ -]?[a-z0-9]+$/i.test(part)) ?? null;
  const countryEntry = Object.entries(countryNames)
    .sort(([left], [right]) => right.length - left.length)
    .find(([name]) => new RegExp(`\\b${name.replaceAll(" ", "\\s+")}\\b`, "i").test(raw));
  const countryName = countryEntry
    ? raw.match(new RegExp(`\\b(${countryEntry[0].replaceAll(" ", "\\s+")})\\b`, "i"))?.[1] ?? null
    : null;
  const countryFromName = countryEntry?.[1] ?? null;
  const explicitCountryCode = parts.find((part) => supportedCountryCodes.has(part)) ?? null;
  const contradiction = countryFromName && explicitCountryCode && countryFromName !== explicitCountryCode
    ? `DESCRIPTION_COUNTRY_CONTRADICTION:${countryFromName}:${explicitCountryCode}`
    : null;
  const countryCode = contradiction ? null : explicitCountryCode ?? countryFromName;
  const countryBrandPart = countryName
    ? parts.find((part) => new RegExp(`\\b${countryName.replaceAll(" ", "\\s+")}\\b`, "i").test(part))
    : null;
  const explicitBrandPart = parts.find((part) => /^[A-Z][A-Z0-9 '&.]{2,80}$/.test(part)
    && !supportedCountryCodes.has(part)
    && !/^\d{2,5}\s*[x×]\s*\d{2,5}$/i.test(part)) ?? null;
  const brandPart = countryBrandPart ?? explicitBrandPart;
  const brandLabel = countryBrandPart && countryName
    ? clean(countryBrandPart.replace(new RegExp(`\\s*${countryName.replaceAll(" ", "\\s+")}\\s*$`, "i"), ""), 200)
    : clean(explicitBrandPart, 200);
  const purpose = parts.find((part) => part !== externalLabel && part !== brandPart
    && !/^[A-Z]{2}$/.test(part) && !/^\d{2,5}\s*[x×]\s*\d{2,5}$/i.test(part)) ?? null;
  const languageMatch = raw.match(/\b(?:language|lang)\s*[:=]\s*([a-z]{2,8})(?:[-_][a-z0-9]{2,8})?\b/i);
  const currencyMatch = raw.match(/\bcurrency\s*[:=]\s*([a-z]{3})\b/i);
  const languageCode = languageMatch?.[1]?.toLowerCase() ?? null;
  return {
    raw,
    externalLabel,
    brandLabel,
    countryName: clean(countryName, 100),
    countryCode,
    purpose: clean(purpose, 300),
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    dimensionProvenance,
    languageCode,
    languageState: languageCode ? "EXPLICIT" : "UNKNOWN",
    currencyCode: currencyMatch?.[1]?.toUpperCase() ?? null,
    contradiction,
  };
}

function tagAttributes(rawTag: string) {
  const attributes: Record<string, string> = {};
  const opening = /^<\s*\/?\s*([a-z0-9:-]+)/i.exec(rawTag);
  const body = rawTag.slice(opening?.[0].length ?? 0, rawTag.lastIndexOf(">"));
  const expression = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of body.matchAll(expression)) {
    const key = match[1].toLowerCase();
    if (key in attributes) throw new PartnerHostedCreativeParseError("Duplicate HTML attributes are not permitted.", "DUPLICATE_ATTRIBUTE");
    attributes[key] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function requireOnlyAttributes(attributes: Record<string, string>, allowed: readonly string[], code: string) {
  const allowlist = new Set(allowed);
  if (Object.keys(attributes).some((key) => !allowlist.has(key))) {
    throw new PartnerHostedCreativeParseError("The provider element contains unsupported attributes.", code);
  }
}

function exactHttpsUrl(value: string | undefined, code: string) {
  if (!value || /^[\s]/.test(value) || /[\s]$/.test(value)) throw new PartnerHostedCreativeParseError("The provider URL is missing or contains surrounding whitespace.", code);
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) throw new Error("unsafe");
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (hostname === "localhost" || /\.(?:localhost|local|internal)$/i.test(hostname)
      || (isIP(hostname) !== 0 && !isPublicAddress(hostname))) throw new Error("private");
    url.hash = "";
    return url;
  } catch {
    throw new PartnerHostedCreativeParseError("The provider URL must be an absolute public HTTPS URL.", code);
  }
}

function oneQueryValue(url: URL, key: string, pattern: RegExp, code: string) {
  const values = url.searchParams.getAll(key);
  if (values.length !== 1 || !pattern.test(values[0])) throw new PartnerHostedCreativeParseError(`Missing or malformed ${key}.`, code);
  return values[0];
}

function requireOnlyQueryKeys(url: URL, keys: readonly string[], code: string) {
  const allowed = new Set(keys);
  if ([...url.searchParams.keys()].some((key) => !allowed.has(key))) {
    throw new PartnerHostedCreativeParseError("The provider URL contains unsupported query parameters.", code);
  }
}

function parseSuperfly(embedCode: string, description: ParsedPartnerDescription): ParsedPartnerHostedCreative | null {
  if (!/superflypartners\.net/i.test(embedCode) && !/creative_id=/i.test(embedCode)) return null;
  if (!/^\s*<\s*a\b[^>]*>\s*<\s*img\b[^>]*\/?\s*>\s*<\s*\/\s*a\s*>\s*$/i.test(embedCode)
    || (embedCode.match(/<\s*a\b/gi) ?? []).length !== 1
    || (embedCode.match(/<\s*img\b/gi) ?? []).length !== 1) {
    throw new PartnerHostedCreativeParseError("Superfly input must be exactly one anchor containing one image.", "SUPERFLY_SHAPE_INVALID");
  }
  const anchorTag = embedCode.match(/<\s*a\b[^>]*>/i)?.[0];
  const imageTag = embedCode.match(/<\s*img\b[^>]*>/i)?.[0];
  if (!anchorTag || !imageTag || !/<\s*\/\s*a\s*>/i.test(embedCode)) {
    throw new PartnerHostedCreativeParseError("Superfly input must contain one anchor with one image.", "SUPERFLY_SHAPE_INVALID");
  }
  const anchor = tagAttributes(anchorTag);
  const image = tagAttributes(imageTag);
  requireOnlyAttributes(anchor, ["href", "target", "rel"], "SUPERFLY_ANCHOR_ATTRIBUTES_INVALID");
  requireOnlyAttributes(image, ["src", "alt", "width", "height"], "SUPERFLY_IMAGE_ATTRIBUTES_INVALID");
  const click = exactHttpsUrl(anchor.href, "SUPERFLY_CLICK_URL_INVALID");
  const impression = exactHttpsUrl(image.src, "SUPERFLY_IMAGE_URL_INVALID");
  if (click.hostname.toLowerCase() !== "go.superflypartners.net" || click.pathname !== "/click") {
    throw new PartnerHostedCreativeParseError("Superfly click host or path is not allowlisted.", "SUPERFLY_CLICK_HOST_INVALID");
  }
  if (impression.hostname.toLowerCase() !== "go.superflypartners.net" || impression.pathname !== "/impression") {
    throw new PartnerHostedCreativeParseError("Superfly impression host or path is not allowlisted.", "SUPERFLY_IMAGE_HOST_INVALID");
  }
  requireOnlyQueryKeys(click, ["o", "a", "c", "creative_id"], "SUPERFLY_CLICK_PARAMETERS_INVALID");
  requireOnlyQueryKeys(impression, ["creative_id", "affiliate_id"], "SUPERFLY_IMAGE_PARAMETERS_INVALID");
  const operatorProgramId = oneQueryValue(click, "o", /^\d{1,20}$/, "SUPERFLY_OPERATOR_INVALID");
  const affiliateId = oneQueryValue(click, "a", /^\d{1,20}$/, "SUPERFLY_AFFILIATE_INVALID");
  const campaignId = oneQueryValue(click, "c", /^\d{1,20}$/, "SUPERFLY_CAMPAIGN_INVALID");
  const creativeId = oneQueryValue(click, "creative_id", /^\d{1,20}$/, "SUPERFLY_CREATIVE_INVALID");
  if (oneQueryValue(impression, "creative_id", /^\d{1,20}$/, "SUPERFLY_CREATIVE_INVALID") !== creativeId
    || oneQueryValue(impression, "affiliate_id", /^\d{1,20}$/, "SUPERFLY_AFFILIATE_INVALID") !== affiliateId) {
    throw new PartnerHostedCreativeParseError("Superfly click and impression identifiers do not match.", "SUPERFLY_IDENTIFIER_CONTRADICTION");
  }
  const providerWidth = positiveDimension(image.width);
  const providerHeight = positiveDimension(image.height);
  const declaredWidth = description.width ?? providerWidth;
  const declaredHeight = description.height ?? providerHeight;
  if (!declaredWidth || !declaredHeight) throw new PartnerHostedCreativeParseError("Superfly dimensions are required.", "SUPERFLY_DIMENSIONS_MISSING");
  const dimensionProvenance = description.dimensionProvenance ?? "PROVIDER_METADATA";
  const normalizedSource = decodeHtmlEntities(embedCode.trim());
  return {
    provider: "SUPERFLY",
    sourceMode: "PARTNER_HOSTED_IMAGE",
    providerIdentityKey: `SUPERFLY:${operatorProgramId}:${affiliateId}:${campaignId}:${creativeId}`,
    externalCreativeId: creativeId,
    affiliateId,
    campaignId,
    adGroupId: null,
    did: null,
    mediaId: null,
    operatorProgramId,
    declaredWidth,
    declaredHeight,
    dimensionProvenance,
    altText: clean(image.alt, 300) ?? description.brandLabel,
    hostedImageUrl: impression.href,
    providerEmbedPath: null,
    providerEmbedParameters: null,
    destinationUrl: click.href,
    destinationUrlHash: sha256(click.href),
    destinationHost: click.hostname.toLowerCase(),
    sourceChecksum: sha256(normalizedSource),
    sourceEvidence: safeUrlEvidence(impression),
    destinationEvidence: safeUrlEvidence(click),
    description,
  };
}

function parseBannerflow(embedCode: string, description: ParsedPartnerDescription): ParsedPartnerHostedCreative | null {
  const scriptTag = embedCode.match(/<\s*script\b[^>]*>/i)?.[0];
  if (!scriptTag) return null;
  if ((embedCode.match(/<\s*script\b/gi) ?? []).length !== 1
    || !/^\s*<\s*script\b[^>]*>\s*<\s*\/\s*script\s*>\s*$/i.test(embedCode)) {
    throw new PartnerHostedCreativeParseError("Exactly one vetted provider script is permitted.", "SCRIPT_COUNT_INVALID");
  }
  const attributes = tagAttributes(scriptTag);
  requireOnlyAttributes(attributes, ["src", "async", "type"], "BANNERFLOW_ATTRIBUTES_INVALID");
  const script = exactHttpsUrl(attributes.src, "BANNERFLOW_SCRIPT_URL_INVALID");
  if (script.hostname.toLowerCase() !== "c.bannerflow.net" || !/^\/a\/[a-f0-9]{24}$/i.test(script.pathname)) {
    throw new PartnerHostedCreativeParseError("Only the vetted c.bannerflow.net creative script contract is permitted.", "BANNERFLOW_PROVIDER_NOT_ALLOWED");
  }
  requireOnlyQueryKeys(script, ["did", "deeplink", "adgroupid", "redirecturl", "media", "campaign"], "BANNERFLOW_PARAMETERS_INVALID");
  const externalCreativeId = script.pathname.slice(3);
  const did = oneQueryValue(script, "did", /^[a-f0-9]{24}$/i, "BANNERFLOW_DID_INVALID");
  const adGroupId = oneQueryValue(script, "adgroupid", /^[a-f0-9]{24}$/i, "BANNERFLOW_ADGROUP_INVALID");
  const mediaId = oneQueryValue(script, "media", /^\d{1,20}$/, "BANNERFLOW_MEDIA_INVALID");
  const campaignId = oneQueryValue(script, "campaign", /^\d{1,20}$/, "BANNERFLOW_CAMPAIGN_INVALID");
  const deeplink = oneQueryValue(script, "deeplink", /^(?:on|off)$/, "BANNERFLOW_DEEPLINK_INVALID");
  const destination = exactHttpsUrl(oneQueryValue(script, "redirecturl", /^https:\/\//i, "BANNERFLOW_DESTINATION_INVALID"), "BANNERFLOW_DESTINATION_INVALID");
  const declaredWidth = description.width;
  const declaredHeight = description.height;
  if (!declaredWidth || !declaredHeight) throw new PartnerHostedCreativeParseError("Bannerflow dimensions must be supplied by deterministic partner metadata.", "BANNERFLOW_DIMENSIONS_MISSING");
  const providerEmbedParameters = { did, deeplink, adgroupid: adGroupId, media: mediaId, campaign: campaignId };
  return {
    provider: "BANNERFLOW",
    sourceMode: "PARTNER_HOSTED_EMBED",
    providerIdentityKey: `BANNERFLOW:${externalCreativeId}:${did}:${adGroupId}:${mediaId}:${campaignId}`,
    externalCreativeId,
    affiliateId: null,
    campaignId,
    adGroupId,
    did,
    mediaId,
    operatorProgramId: null,
    declaredWidth,
    declaredHeight,
    dimensionProvenance: description.dimensionProvenance!,
    altText: description.brandLabel && description.purpose ? `${description.brandLabel} — ${description.purpose}` : description.brandLabel,
    hostedImageUrl: null,
    providerEmbedPath: script.pathname,
    providerEmbedParameters,
    destinationUrl: destination.href,
    destinationUrlHash: sha256(destination.href),
    destinationHost: destination.hostname.toLowerCase(),
    sourceChecksum: sha256(decodeHtmlEntities(embedCode.trim())),
    sourceEvidence: safeUrlEvidence(script),
    destinationEvidence: safeUrlEvidence(destination),
    description,
  };
}

export function parsePartnerHostedCreative(value: string, metadata: Partial<PartnerItemMetadata> = {}): ParsedPartnerHostedCreative | null {
  const { description: rawDescription, embedCode: wrappedEmbed } = splitPartnerCreativeInput(value);
  const description = parsePartnerDescription(rawDescription, metadata);
  const embedCode = decodeHtmlEntities(decodeHtmlEntities(wrappedEmbed));
  const superfly = parseSuperfly(embedCode, description);
  if (superfly) return superfly;
  const bannerflow = parseBannerflow(embedCode, description);
  if (bannerflow) return bannerflow;
  if (/<\s*script\b/i.test(embedCode)) {
    throw new PartnerHostedCreativeParseError("The executable provider is not allowlisted.", "EXECUTABLE_PROVIDER_NOT_ALLOWED");
  }
  return null;
}

export function bannerflowScriptUrl(
  input: Pick<ParsedPartnerHostedCreative, "provider" | "providerEmbedPath" | "providerEmbedParameters">,
  governedRedirectUrl: string,
  publicOrigin = "https://b4gamble.com",
) {
  if (input.provider !== "BANNERFLOW" || !input.providerEmbedPath || !input.providerEmbedParameters) {
    throw new PartnerHostedCreativeParseError("Bannerflow structured parameters are unavailable.", "BANNERFLOW_PARAMETERS_INVALID");
  }
  const expectedOrigin = new URL(publicOrigin).origin;
  const governed = new URL(governedRedirectUrl, expectedOrigin);
  if (governed.origin !== expectedOrigin || !/^\/r\/[a-z0-9][a-z0-9-]*\?creative=[0-9a-f-]{36}$/i.test(`${governed.pathname}${governed.search}`)) {
    throw new PartnerHostedCreativeParseError("Bannerflow redirect must be a governed B4GAMBLE creative route.", "BANNERFLOW_GOVERNED_REDIRECT_INVALID");
  }
  const url = new URL(input.providerEmbedPath, "https://c.bannerflow.net");
  for (const key of ["did", "deeplink", "adgroupid", "media", "campaign"] as const) {
    const value = input.providerEmbedParameters[key];
    if (!value) throw new PartnerHostedCreativeParseError(`Missing structured ${key}.`, "BANNERFLOW_PARAMETERS_INVALID");
    url.searchParams.set(key, value);
  }
  url.searchParams.set("redirecturl", governed.href);
  return url.href;
}

export function isVettedPartnerHostedCreativesEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VETTED_PARTNER_HOSTED_CREATIVES_ENABLED === "true";
}

export function partnerHostedBindingFingerprint(input: {
  affiliateOfferId: string | null;
  redirectSlugId: string | null;
  trackingLinkId: string | null;
  destinationUrlHash: string;
}) {
  return sha256([
    input.affiliateOfferId ?? "",
    input.redirectSlugId ?? "",
    input.trackingLinkId ?? "",
    input.destinationUrlHash,
  ].join(":"));
}
