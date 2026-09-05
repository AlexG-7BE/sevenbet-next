import { createHash, randomUUID } from "node:crypto";

const MAX_CREATIVES = 20;
const MAX_ATTRIBUTE_VALUE = 4_096;
const IDENTIFIER_KEYS = /^(?:id|creative|creative_?id|banner|banner_?id|campaign|campaign_?id|program|program_?id|partner|partner_?id|operator|operator_?id|aff(?:iliate)?_?id)$/i;
const IMAGE_DATA_KEYS = new Set(["data-image", "data-image-url", "data-banner", "data-banner-url", "data-src"]);
const LANGUAGE_CODES = new Set(["en", "fi", "sv", "no", "nb", "nn", "da", "de", "fr", "es", "it", "pt", "nl", "pl"]);
const MARKET_CODES = new Set(["GB", "UK", "FI", "SE", "NO", "DK", "DE", "FR", "ES", "IT", "PT", "NL", "PL", "CA", "AU", "BR"]);
const CURRENCY_CODES = new Set(["GBP", "EUR", "USD", "CAD", "AUD", "SEK", "NOK", "DKK", "PLN", "BRL"]);

export type SafeUrlEvidence = {
  urlHash: string;
  origin: string;
  pathname: string;
  queryKeys: string[];
};

export type ParsedCreativeInternal = {
  id: string;
  sourceKind: "ANCHOR_IMAGE" | "IMAGE" | "DIRECT_URL" | "SAFE_DATA_IMAGE";
  source: SafeUrlEvidence;
  anchor: SafeUrlEvidence | null;
  declaredWidth: number | null;
  declaredHeight: number | null;
  alt: string | null;
  title: string | null;
  providerDomain: string;
  providerReference: string | null;
  identifiers: Record<string, string>;
  languageClues: string[];
  marketClues: string[];
  currencyClues: string[];
  warnings: string[];
  /** Ephemeral fetch input. This field must never be persisted or logged. */
  sourceUrl: string;
  /** Ephemeral comparison evidence. This field must never be persisted or logged. */
  anchorHref: string | null;
};

export type ParsedPartnerSnippet = {
  snippetChecksum: string;
  creatives: ParsedCreativeInternal[];
  unsupportedElements: Array<"SCRIPT" | "IFRAME">;
  warnings: string[];
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity: string) => {
    if (entity[0] !== "#") return named[entity.toLowerCase()] ?? match;
    const hexadecimal = entity[1]?.toLowerCase() === "x";
    const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isSafeInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return match;
    return String.fromCodePoint(codePoint);
  });
}

function cleanText(value: string | undefined, maximum = 300) {
  const cleaned = value?.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

function positiveInteger(value: string | undefined) {
  if (!value || !/^\d{1,6}$/.test(value.trim())) return null;
  const parsed = Number(value);
  return parsed > 0 && parsed <= 100_000 ? parsed : null;
}

function safeHttpsUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(decodeHtmlEntities(value.trim()));
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || !parsed.hostname) return null;
    parsed.hash = "";
    return parsed;
  } catch {
    return null;
  }
}

export function safeUrlEvidence(url: URL): SafeUrlEvidence {
  return {
    urlHash: sha256(url.href),
    origin: url.origin.slice(0, 300),
    pathname: url.pathname.slice(0, 1000),
    queryKeys: [...new Set([...url.searchParams.keys()].map((key) => key.slice(0, 100)))].sort().slice(0, 50),
  };
}

function parseTag(raw: string) {
  let cursor = 0;
  while (/\s/.test(raw[cursor] ?? "")) cursor += 1;
  const closing = raw[cursor] === "/";
  if (closing) cursor += 1;
  while (/\s/.test(raw[cursor] ?? "")) cursor += 1;
  const nameStart = cursor;
  while (/[a-z0-9:-]/i.test(raw[cursor] ?? "")) cursor += 1;
  const name = raw.slice(nameStart, cursor).toLowerCase();
  const attributes: Record<string, string> = {};
  while (cursor < raw.length) {
    while (/\s|\//.test(raw[cursor] ?? "")) cursor += 1;
    if (cursor >= raw.length) break;
    const keyStart = cursor;
    while (/[^\s=/>]/.test(raw[cursor] ?? "")) cursor += 1;
    const key = raw.slice(keyStart, cursor).toLowerCase();
    while (/\s/.test(raw[cursor] ?? "")) cursor += 1;
    let value = "";
    if (raw[cursor] === "=") {
      cursor += 1;
      while (/\s/.test(raw[cursor] ?? "")) cursor += 1;
      const quote = raw[cursor] === '"' || raw[cursor] === "'" ? raw[cursor++] : null;
      const valueStart = cursor;
      if (quote) while (cursor < raw.length && raw[cursor] !== quote) cursor += 1;
      else while (cursor < raw.length && !/[\s>]/.test(raw[cursor] ?? "")) cursor += 1;
      value = raw.slice(valueStart, cursor).slice(0, MAX_ATTRIBUTE_VALUE);
      if (quote && raw[cursor] === quote) cursor += 1;
    }
    if (key && !(key in attributes) && Object.keys(attributes).length < 80) attributes[key] = decodeHtmlEntities(value);
  }
  return { closing, name, attributes };
}

function findTagEnd(input: string, start: number) {
  let quote: string | null = null;
  for (let index = start; index < input.length; index += 1) {
    const character = input[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === ">") return index;
  }
  return -1;
}

function normalizedIdentifier(value: string) {
  const cleaned = value.trim();
  return /^[a-z0-9][a-z0-9._:-]{0,199}$/i.test(cleaned) ? cleaned : null;
}

function clues(...values: Array<string | null | undefined>) {
  const tokens = values.join(" ").split(/[^a-z0-9]+/i).filter(Boolean);
  const languageClues = new Set<string>();
  const marketClues = new Set<string>();
  const currencyClues = new Set<string>();
  for (const token of tokens) {
    const lower = token.toLowerCase();
    const upper = token.toUpperCase();
    if (LANGUAGE_CODES.has(lower)) languageClues.add(lower);
    if (MARKET_CODES.has(upper)) marketClues.add(upper === "UK" ? "GB" : upper);
    if (CURRENCY_CODES.has(upper)) currencyClues.add(upper);
  }
  return { languageClues: [...languageClues].sort(), marketClues: [...marketClues].sort(), currencyClues: [...currencyClues].sort() };
}

function identifiers(attributes: Record<string, string>, sourceUrl: URL, anchorUrl: URL | null) {
  const output: Record<string, string> = {};
  const store = (key: string, value: string, sensitive: boolean) => {
    const normalized = normalizedIdentifier(value);
    if (!normalized || Object.keys(output).length >= 30) return;
    if (sensitive || /aff(?:iliate)?_?id|campaign/i.test(key)) output[`${key.slice(0, 70)}_hash`] = sha256(normalized).slice(0, 24);
    else output[key.slice(0, 80)] = normalized;
  };
  for (const [key, value] of Object.entries(attributes)) {
    const normalizedKey = key.replace(/^data-/, "");
    if (!IDENTIFIER_KEYS.test(normalizedKey)) continue;
    store(normalizedKey, value, false);
  }
  for (const [url, sensitive] of [[sourceUrl, false], [anchorUrl, true]] as const) {
    if (!url) continue;
    for (const [key, value] of url.searchParams) {
      if (!IDENTIFIER_KEYS.test(key)) continue;
      store(key, value, sensitive);
    }
  }
  return output;
}

function providerReference(values: Record<string, string>) {
  const preferred = Object.entries(values).find(([key]) => /creative|banner|campaign|program|partner|operator/i.test(key));
  return preferred ? `${preferred[0]}:${preferred[1]}`.slice(0, 200) : null;
}

export function parsePartnerSnippet(snippet: string): ParsedPartnerSnippet {
  if (!snippet.trim()) throw new Error("Partner snippet is empty");
  if (new TextEncoder().encode(snippet).byteLength > 128 * 1024) throw new Error("Partner snippet exceeds 128 KiB");
  const input = decodeHtmlEntities(decodeHtmlEntities(snippet));
  const creatives: ParsedCreativeInternal[] = [];
  const unsupported = new Set<"SCRIPT" | "IFRAME">();
  const warnings = new Set<string>();
  const seenSources = new Set<string>();
  let anchor: URL | null = null;

  const addCreative = (sourceValue: string | undefined, attributes: Record<string, string>, sourceKind: ParsedCreativeInternal["sourceKind"], anchorValue: URL | null) => {
    if (creatives.length >= MAX_CREATIVES) { warnings.add("CREATIVE_LIMIT_REACHED"); return; }
    const sourceUrl = safeHttpsUrl(sourceValue);
    if (!sourceUrl) { warnings.add("UNSAFE_OR_INVALID_IMAGE_URL"); return; }
    const key = sourceUrl.href;
    if (seenSources.has(key)) return;
    seenSources.add(key);
    const ids = identifiers(attributes, sourceUrl, anchorValue);
    const detectedClues = clues(sourceUrl.href, anchorValue?.href, attributes.alt, attributes.title, ...Object.values(attributes));
    const declaredWidth = positiveInteger(attributes.width);
    const declaredHeight = positiveInteger(attributes.height);
    const itemWarnings: string[] = [];
    if ((attributes.width && declaredWidth === null) || (attributes.height && declaredHeight === null)) itemWarnings.push("INVALID_DECLARED_DIMENSIONS");
    creatives.push({
      id: randomUUID(),
      sourceKind: anchorValue && sourceKind === "IMAGE" ? "ANCHOR_IMAGE" : sourceKind,
      source: safeUrlEvidence(sourceUrl),
      anchor: anchorValue ? safeUrlEvidence(anchorValue) : null,
      declaredWidth,
      declaredHeight,
      alt: cleanText(attributes.alt),
      title: cleanText(attributes.title),
      providerDomain: sourceUrl.hostname.toLowerCase(),
      providerReference: providerReference(ids),
      identifiers: ids,
      ...detectedClues,
      warnings: itemWarnings,
      sourceUrl: sourceUrl.href,
      anchorHref: anchorValue?.href ?? null,
    });
  };

  let cursor = 0;
  let textOutsideTags = "";
  while (cursor < input.length) {
    if (input[cursor] !== "<") { textOutsideTags += input[cursor++]; continue; }
    const end = findTagEnd(input, cursor + 1);
    if (end < 0) { textOutsideTags += input.slice(cursor); break; }
    const tag = parseTag(input.slice(cursor + 1, end));
    cursor = end + 1;
    if (!tag.name) continue;
    if (tag.name === "a") {
      anchor = tag.closing ? null : safeHttpsUrl(tag.attributes.href);
      if (!tag.closing && tag.attributes.href && !anchor) warnings.add("UNSAFE_ANCHOR_IGNORED");
      continue;
    }
    if (tag.name === "img" && !tag.closing) {
      addCreative(tag.attributes.src || tag.attributes["data-src"], tag.attributes, "IMAGE", anchor);
      continue;
    }
    if ((tag.name === "script" || tag.name === "iframe") && !tag.closing) {
      const element = tag.name.toUpperCase() as "SCRIPT" | "IFRAME";
      unsupported.add(element);
      warnings.add("UNSAFE_OR_NON_IMAGE_CREATIVE");
      for (const key of IMAGE_DATA_KEYS) {
        if (tag.attributes[key]) addCreative(tag.attributes[key], tag.attributes, "SAFE_DATA_IMAGE", anchor);
      }
      if (tag.name === "script" || tag.name === "iframe") {
        const closeIndex = input.toLowerCase().indexOf(`</${tag.name}`, cursor);
        if (closeIndex >= 0) {
          const closeEnd = findTagEnd(input, closeIndex + 2);
          cursor = closeEnd >= 0 ? closeEnd + 1 : input.length;
        } else cursor = input.length;
      }
    }
  }

  for (const match of textOutsideTags.matchAll(/https:\/\/[^\s<>"']+/gi)) {
    const candidate = match[0].replace(/[),.;]+$/, "");
    addCreative(candidate, {}, "DIRECT_URL", null);
  }
  if (!creatives.length) warnings.add(unsupported.size ? "REVIEW_REQUIRED" : "NO_IMAGE_CREATIVE_FOUND");
  return {
    snippetChecksum: sha256(snippet),
    creatives,
    unsupportedElements: [...unsupported].sort(),
    warnings: [...warnings].sort(),
  };
}

export function persistedCreativeEvidence(creative: ParsedCreativeInternal) {
  const { sourceUrl: _sourceUrl, anchorHref: _anchorHref, ...persisted } = creative;
  return persisted;
}
