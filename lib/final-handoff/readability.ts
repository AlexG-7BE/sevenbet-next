/**
 * Readability pass for the captured handoff pages (Founder, 25 September 2026).
 *
 * The handoff HTML carries its typography in inline styles. This pass reads those
 * styles (with inheritance) and marks the elements that break one of the four
 * approved readability rules with a `data-readable` token. `app/globals.css` then
 * applies the fix per token: at every width on the other handoff pages, and only
 * inside the phone media query on Home, whose desktop composition stays frozen.
 *
 * Tokens:
 * - `caps`: uppercase text at 13px or less tracked at .15em or wider → 13px, .08em.
 * - `paper`: faint paper text (alpha .5 or lower) on a dark surface → .68 paper.
 * - `grey`: metal grey #8b8a82 on a light surface → #5e5d57.
 * - `olive`: olive #777500 on a light surface → the deep olive token.
 * - `danger`: danger red that misses AA on a light surface → the danger text token.
 * - `prose`: italic serif body copy of 40+ characters at 20px or less → 16px upright sans.
 * - `small`: sentence-case text under 14px that runs 60+ characters → 14px.
 * - `leading`: a `small` element whose line height is under 1.45 → 1.5.
 */

type Rgba = Readonly<{ r: number; g: number; b: number; a: number }>;

type LineHeight = Readonly<{ kind: "normal" } | { kind: "ratio"; value: number } | { kind: "px"; value: number }>;

type EffectiveStyle = Readonly<{
  background: Rgba;
  bold: boolean;
  fontSize: number;
  italic: boolean;
  letterSpacing: number;
  lineHeight: LineHeight;
  serif: boolean;
  uppercase: boolean;
}>;

type HandoffNode = {
  children: HandoffNode[];
  declared: Map<string, string>;
  heading: boolean;
  name: string;
  parent: HandoffNode | null;
  startTagEnd: number;
  text: string;
  textRuns: string[];
};

export const READABLE_TOKENS = ["caps", "paper", "grey", "olive", "danger", "prose", "small", "leading"] as const;
export type ReadableToken = (typeof READABLE_TOKENS)[number];

const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea"]);
const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const NIGHT: Rgba = { r: 16, g: 15, b: 15, a: 1 };

function decodeEntities(value: string) {
  return value.replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, " ");
}

function splitDeclarations(style: string) {
  const declarations: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of style) {
    if (character === "(") depth += 1;
    if (character === ")") depth = Math.max(0, depth - 1);
    if (character === ";" && depth === 0) {
      declarations.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  declarations.push(current);
  return declarations;
}

function parseStyle(startTag: string) {
  const declared = new Map<string, string>();
  const style = /\sstyle="([^"]*)"/.exec(startTag)?.[1];
  if (!style) return declared;
  for (const declaration of splitDeclarations(decodeStyle(style))) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim().replace(/\s*!important$/, "");
    if (property) declared.set(property, value);
  }
  return declared;
}

function decodeStyle(style: string) {
  return style.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
}

function parseColor(value: string): Rgba | null {
  const functional = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/i.exec(value);
  if (functional) {
    const alpha = functional[4] === undefined ? 1 : functional[4].endsWith("%") ? Number.parseFloat(functional[4]) / 100 : Number(functional[4]);
    return { r: Number(functional[1]), g: Number(functional[2]), b: Number(functional[3]), a: alpha };
  }
  const hex = /#([\da-f]{6}|[\da-f]{3})\b/i.exec(value)?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex;
  return { r: Number.parseInt(full.slice(0, 2), 16), g: Number.parseInt(full.slice(2, 4), 16), b: Number.parseInt(full.slice(4, 6), 16), a: 1 };
}

function composite(foreground: Rgba, background: Rgba): Rgba {
  return {
    r: foreground.r * foreground.a + background.r * (1 - foreground.a),
    g: foreground.g * foreground.a + background.g * (1 - foreground.a),
    b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    a: 1,
  };
}

function luminance(color: Rgba) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(foreground: Rgba, background: Rgba) {
  const text = luminance(composite(foreground, background));
  const surface = luminance(background);
  return (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05);
}

function sameRgb(color: Rgba, r: number, g: number, b: number) {
  return Math.round(color.r) === r && Math.round(color.g) === g && Math.round(color.b) === b;
}

/** Sizes resolve to their smallest authored value: the phone reading is the one the rules protect. */
function parseLength(value: string, relativeTo: number): number | null {
  const trimmed = value.trim();
  const clamp = /^clamp\(\s*([^,]+),/.exec(trimmed);
  if (clamp) return parseLength(clamp[1], relativeTo);
  const measurement = /^(-?[\d.]+)(px|em|rem|%)?$/.exec(trimmed);
  if (!measurement) return null;
  const amount = Number(measurement[1]);
  if (measurement[2] === "em") return amount * relativeTo;
  if (measurement[2] === "rem") return amount * 16;
  if (measurement[2] === "%") return (amount / 100) * relativeTo;
  return amount;
}

function firstFamily(value: string) {
  return value.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
}

function isSerifFamily(value: string) {
  const family = firstFamily(value);
  return !family.includes("sans") && /serif|instrument|cormorant|georgia/.test(family);
}

function parseLineHeight(value: string): LineHeight | null {
  const trimmed = value.trim();
  if (trimmed === "normal") return { kind: "normal" };
  if (/^[\d.]+$/.test(trimmed)) return { kind: "ratio", value: Number(trimmed) };
  const px = parseLength(trimmed, 16);
  return px === null ? null : { kind: "px", value: px };
}

function computeStyle(node: HandoffNode, parent: EffectiveStyle): EffectiveStyle {
  const declared = node.declared;
  let { bold, fontSize, italic, letterSpacing, lineHeight, serif, uppercase } = parent;
  let background = parent.background;

  const font = declared.get("font");
  if (font) {
    const shorthand = /^(?:(italic|oblique|normal)\s+)?(?:(\d{3}|bold|normal)\s+)?(-?[\d.]+(?:px|em|rem))(?:\/(\S+))?\s+(.+)$/i.exec(font);
    if (shorthand) {
      italic = shorthand[1] === "italic" || shorthand[1] === "oblique";
      bold = shorthand[2] === "bold" || Number(shorthand[2]) >= 700;
      fontSize = parseLength(shorthand[3], parent.fontSize) ?? fontSize;
      lineHeight = shorthand[4] ? parseLineHeight(shorthand[4]) ?? { kind: "normal" } : { kind: "normal" };
      serif = isSerifFamily(shorthand[5]);
    }
  }
  const size = declared.get("font-size");
  if (size) fontSize = parseLength(size, parent.fontSize) ?? fontSize;
  const family = declared.get("font-family");
  if (family) serif = isSerifFamily(family);
  const style = declared.get("font-style");
  if (style) italic = style === "italic" || style === "oblique";
  const weight = declared.get("font-weight");
  if (weight) bold = weight === "bold" || Number(weight) >= 700;
  const transform = declared.get("text-transform");
  if (transform) uppercase = transform === "uppercase";
  const spacing = declared.get("letter-spacing");
  if (spacing) letterSpacing = spacing === "normal" ? 0 : parseLength(spacing, fontSize) ?? letterSpacing;
  const leading = declared.get("line-height");
  if (leading) lineHeight = parseLineHeight(leading) ?? lineHeight;
  const surface = declared.get("background-color") ?? declared.get("background");
  const surfaceColor = surface ? parseColor(surface) : null;
  if (surfaceColor && surfaceColor.a > 0) background = composite(surfaceColor, background);

  return { background, bold, fontSize, italic, letterSpacing, lineHeight, serif, uppercase };
}

function parseHandoff(html: string) {
  const root: HandoffNode = { children: [], declared: new Map(), heading: false, name: "#root", parent: null, startTagEnd: 0, text: "", textRuns: [] };
  const stack: HandoffNode[] = [root];
  const tagPattern = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?\s*(\/?)>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(html))) {
    const run = html.slice(cursor, match.index);
    stack[stack.length - 1].text += run;
    if (run.trim()) stack[stack.length - 1].textRuns.push(run);
    cursor = match.index + match[0].length;
    if (match[0].startsWith("<!--")) continue;
    const name = match[2].toLowerCase();
    if (match[1]) {
      const openIndex = stack.map((node) => node.name).lastIndexOf(name);
      if (openIndex > 0) stack.length = openIndex;
      continue;
    }
    const parent = stack[stack.length - 1];
    const node: HandoffNode = {
      children: [],
      declared: parseStyle(match[0]),
      heading: HEADINGS.has(name) || parent.heading,
      name,
      parent,
      startTagEnd: cursor,
      text: "",
      textRuns: [],
    };
    parent.children.push(node);
    if (RAW_TEXT_ELEMENTS.has(name)) {
      const close = html.indexOf(`</${name}`, cursor);
      cursor = close < 0 ? html.length : close;
      tagPattern.lastIndex = cursor;
      continue;
    }
    if (!match[3] && !VOID_ELEMENTS.has(name)) stack.push(node);
  }
  return root;
}

function collapsedLength(value: string) {
  return decodeEntities(value).replace(/\s+/g, " ").trim().length;
}

function textContent(node: HandoffNode): string {
  return node.text + node.children.map(textContent).join("");
}

/** The longest single text run inside the element: a row of short items is not a paragraph. */
function longestRun(node: HandoffNode): number {
  return Math.max(0, ...node.textRuns.map(collapsedLength), ...node.children.map(longestRun));
}

function declaresAny(node: HandoffNode, properties: readonly string[]) {
  return properties.some((property) => node.declared.has(property));
}

function hasDescendant(node: HandoffNode, predicate: (child: HandoffNode) => boolean): boolean {
  return node.children.some((child) => predicate(child) || hasDescendant(child, predicate));
}

function lineHeightRatio(style: EffectiveStyle) {
  if (style.lineHeight.kind === "normal") return 1.2;
  if (style.lineHeight.kind === "ratio") return style.lineHeight.value;
  return style.lineHeight.value / style.fontSize;
}

function isLargeText(style: EffectiveStyle) {
  return style.fontSize >= 24 || (style.fontSize >= 18.66 && style.bold);
}

function tokensFor(node: HandoffNode, style: EffectiveStyle): ReadableToken[] {
  const content = textContent(node);
  const length = collapsedLength(content);
  if (!length) return [];
  const tokens: ReadableToken[] = [];

  if (
    declaresAny(node, ["letter-spacing", "text-transform", "font-size", "font"])
    && style.uppercase
    && style.fontSize <= 13
    && style.letterSpacing / style.fontSize >= 0.15 - 1e-6
  ) tokens.push("caps");

  const color = node.declared.has("color") ? parseColor(node.declared.get("color") ?? "") : null;
  if (color) {
    const light = luminance(style.background) > 0.5;
    const passes = contrast(color, style.background) >= (isLargeText(style) ? 3 : 4.5);
    if (sameRgb(color, 250, 250, 247) && !light && color.a <= 0.5 + 1e-6 && (!isLargeText(style) || !passes)) tokens.push("paper");
    if (sameRgb(color, 139, 138, 130) && light) tokens.push("grey");
    if (sameRgb(color, 119, 117, 0) && light) tokens.push("olive");
    if (sameRgb(color, 185, 75, 71) && light && !passes) tokens.push("danger");
  }

  if (
    declaresAny(node, ["font-style", "font-family", "font"])
    && !node.heading
    && style.italic
    && style.serif
    && style.fontSize <= 20
    && length >= 40
    && !hasDescendant(node, (child) => child.heading)
  ) tokens.push("prose");

  if (
    declaresAny(node, ["font-size", "font"])
    && !style.uppercase
    && style.fontSize < 14
    && longestRun(node) >= 60
    && !hasDescendant(node, (child) => declaresAny(child, ["font-size", "font"]))
  ) {
    tokens.push("small");
    if (lineHeightRatio(style) < 1.45) tokens.push("leading");
  }

  return tokens;
}

/** Returns each element's readability tokens keyed by the offset where its start tag ends. */
export function handoffReadabilityTokens(html: string) {
  const tokens = new Map<number, ReadableToken[]>();
  const root = parseHandoff(html);
  const rootStyle: EffectiveStyle = {
    background: NIGHT,
    bold: false,
    fontSize: 16,
    italic: false,
    letterSpacing: 0,
    lineHeight: { kind: "normal" },
    serif: false,
    uppercase: false,
  };
  const visit = (node: HandoffNode, parentStyle: EffectiveStyle) => {
    const style = computeStyle(node, parentStyle);
    const found = tokensFor(node, style);
    if (found.length) tokens.set(node.startTagEnd, found);
    for (const child of node.children) visit(child, style);
  };
  for (const child of root.children) visit(child, rootStyle);
  return tokens;
}

const MARKED_HANDOFF_CACHE_LIMIT = 32;
const markedHandoffCache = new Map<string, string>();

/**
 * Adds `data-readable` tokens to the handoff elements that break an approved readability
 * rule. The captured copy, inline styles and structure are unchanged; CSS owns the fix.
 */
export function markHandoffReadability(html: string) {
  const cached = markedHandoffCache.get(html);
  if (cached !== undefined) return cached;
  const tokens = handoffReadabilityTokens(html);
  let output = "";
  let cursor = 0;
  for (const offset of [...tokens.keys()].sort((left, right) => left - right)) {
    const tagEnd = offset - (html[offset - 2] === "/" ? 2 : 1);
    output += `${html.slice(cursor, tagEnd)} data-readable="${tokens.get(offset)?.join(" ")}"`;
    cursor = tagEnd;
  }
  output += html.slice(cursor);
  // Each page renders a handful of locale variants: keep them, bounded, so a render never re-parses them.
  if (markedHandoffCache.size >= MARKED_HANDOFF_CACHE_LIMIT) markedHandoffCache.delete(markedHandoffCache.keys().next().value ?? "");
  markedHandoffCache.set(html, output);
  return output;
}
