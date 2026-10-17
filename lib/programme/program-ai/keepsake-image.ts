/**
 * "Save as image": the keepsake card of a step drawn on a canvas, on the device (Founder, 13 October
 * 2026). Nothing is sent anywhere: the picture is made from what the screen already shows and is
 * handed to the share sheet or saved as a file. Text is drawn directly, so the page's
 * Content-Security-Policy needs nothing new (no foreign image, no inline style, no worker).
 */

export type KeepsakeRow = { key: string; label: string; value: string };
export type KeepsakeModel = { title: string; sentence?: string; rows: readonly KeepsakeRow[] };
export type KeepsakeFonts = { sans: string; serif: string };

/** A value longer than this takes the whole width of the card, on the screen and in the picture. */
export const KEEPSAKE_WIDE_VALUE = 26;

/** A label with a word longer than this does not fit half the card without breaking inside the word. */
export const KEEPSAKE_LONG_LABEL_WORD = 14;

export function keepsakeRowIsWide(value: string, label = "") {
  return value.length > KEEPSAKE_WIDE_VALUE || label.split(/\s+/).some((word) => word.length > KEEPSAKE_LONG_LABEL_WORD);
}

/** Long sentences are set smaller so the card stays a card. */
export function keepsakeSentenceSize(sentence: string): "short" | "medium" | "long" {
  return sentence.length > 180 ? "long" : sentence.length > 90 ? "medium" : "short";
}

const SCALE = 3;
const WIDTH = 412;
const MARGIN = 20;
const PAD = 24;
const PAPER = "#fafaf7";
const INK = "#100f0f";
const NIGHT = "#090909";
const LABEL = "rgba(16, 15, 15, .62)";
const sentenceType = { short: { size: 35, leading: 1.06 }, medium: { size: 26, leading: 1.14 }, long: { size: 19, leading: 1.3 } } as const;

type Context = CanvasRenderingContext2D;

function spacedWidth(context: Context, text: string, spacing: number) {
  return [...text].reduce((width, character) => width + context.measureText(character).width + spacing, 0) - (text ? spacing : 0);
}

/** Letter-spaced text, drawn glyph by glyph: canvas letter-spacing is not available in every browser. */
function drawSpaced(context: Context, text: string, x: number, y: number, spacing: number) {
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + spacing;
  }
}

function wrap(context: Context, text: string, maxWidth: number, width: (line: string) => number = (line) => context.measureText(line).width) {
  const lines: string[] = [];
  // A no-break space keeps a number or a time range on one line, as on the card; word joiners
  // only matter to the browser, since lines here break at spaces alone.
  for (const paragraph of text.replace(/\u2060/g, "").split(/\n+/)) {
    let line = "";
    for (const word of paragraph.split(/[^\S\u00a0]+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || width(candidate) <= maxWidth) { line = candidate; continue; }
      lines.push(line);
      line = word;
    }
    if (line) lines.push(line);
  }
  // A single word wider than the card is cut into pieces rather than drawn past the edge.
  return lines.flatMap((line) => {
    if (width(line) <= maxWidth) return [line];
    const pieces: string[] = [];
    let piece = "";
    for (const character of line) {
      if (piece && width(piece + character) > maxWidth) { pieces.push(piece); piece = character; } else piece += character;
    }
    if (piece) pieces.push(piece);
    return pieces;
  });
}

function roundedRect(context: Context, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

/**
 * Lays the card out and, when `paint` is set, draws it. Returns the height in CSS pixels, so the
 * same code measures first and paints second.
 */
function compose(context: Context, model: KeepsakeModel, fonts: KeepsakeFonts, paint: boolean, height = 0) {
  const sans = `${fonts.sans}, Arial, sans-serif`;
  const serif = `${fonts.serif}, Georgia, serif`;
  const cardX = MARGIN;
  const cardWidth = WIDTH - MARGIN * 2;
  const inner = cardWidth - PAD * 2;
  const left = cardX + PAD;
  context.textBaseline = "top";
  if (paint) {
    context.fillStyle = NIGHT;
    context.fillRect(0, 0, WIDTH, height);
    context.fillStyle = PAPER;
    roundedRect(context, cardX, MARGIN, cardWidth, height - MARGIN * 2, 22);
    context.fill();
  }
  let y = MARGIN + PAD;

  // The result's name and the brand mark.
  const title = model.title.toLocaleUpperCase();
  context.font = `900 12px ${sans}`;
  const brandWidth = spacedWidth(context, "B4GAMBLE", 0.6);
  context.font = `700 12px ${sans}`;
  const titleLines = wrap(context, title, inner - brandWidth - 14, (line) => spacedWidth(context, line, 2.16));
  if (paint) {
    context.fillStyle = LABEL;
    titleLines.forEach((line, index) => drawSpaced(context, line, left, y + index * 16, 2.16));
    context.font = `900 12px ${sans}`;
    context.fillStyle = INK;
    drawSpaced(context, "B4GAMBLE", left + inner - brandWidth, y, 0.6);
  }
  y += Math.max(1, titleLines.length) * 16;

  if (model.sentence) {
    const type = sentenceType[keepsakeSentenceSize(model.sentence)];
    context.font = `italic 400 ${type.size}px ${serif}`;
    const lines = wrap(context, model.sentence, inner);
    y += 18;
    if (paint) {
      context.fillStyle = INK;
      lines.forEach((line, index) => context.fillText(line, left, y + index * type.size * type.leading));
    }
    y += lines.length * type.size * type.leading;
  }

  if (model.rows.length) {
    y += model.sentence ? 26 : 4;
    if (model.sentence) {
      // The ticket cut: a dashed line with a notch on each edge.
      if (paint) {
        context.strokeStyle = "rgba(16, 15, 15, .22)";
        context.lineWidth = 1.5;
        context.setLineDash([5, 4]);
        context.beginPath();
        context.moveTo(cardX + 18, y);
        context.lineTo(cardX + cardWidth - 18, y);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = NIGHT;
        for (const x of [cardX, cardX + cardWidth]) { context.beginPath(); context.arc(x, y, 10, 0, Math.PI * 2); context.fill(); }
      }
      y += 22;
    } else y += 18;

    const gap = 16;
    const column = (inner - gap) / 2;
    const cells: Array<{ row: KeepsakeRow; wide: boolean }> = model.rows.map((row) => ({ row, wide: keepsakeRowIsWide(row.value, row.label) }));
    let index = 0;
    while (index < cells.length) {
      const pair = cells[index].wide || !cells[index + 1] || cells[index + 1].wide ? [cells[index]] : [cells[index], cells[index + 1]];
      let rowHeight = 0;
      pair.forEach((cell, position) => {
        const width = cell.wide ? inner : column;
        const x = left + position * (column + gap);
        context.font = `700 12px ${sans}`;
        const labelLines = wrap(context, cell.row.label.toLocaleUpperCase(), width, (line) => spacedWidth(context, line, 0.96));
        context.font = `650 16px ${sans}`;
        const valueLines = wrap(context, cell.row.value, width);
        if (paint) {
          context.font = `700 12px ${sans}`;
          context.fillStyle = LABEL;
          labelLines.forEach((line, lineIndex) => drawSpaced(context, line, x, y + lineIndex * 16, 0.96));
          context.font = `650 16px ${sans}`;
          context.fillStyle = INK;
          valueLines.forEach((line, lineIndex) => context.fillText(line, x, y + labelLines.length * 16 + 5 + lineIndex * 20));
        }
        rowHeight = Math.max(rowHeight, labelLines.length * 16 + 5 + valueLines.length * 20);
      });
      y += rowHeight + (index + pair.length < cells.length ? 20 : 0);
      index += pair.length;
    }
  }
  return y + PAD + MARGIN;
}

/** The card as a PNG. Fonts are the page's own: the families the card on screen is set in. */
export async function keepsakeImage(model: KeepsakeModel, fonts: KeepsakeFonts): Promise<Blob> {
  const text = [model.title, model.sentence ?? "", ...model.rows.flatMap((row) => [row.label, row.value]), "B4GAMBLE"].join(" ");
  await Promise.all([
    document.fonts.load(`700 12px ${fonts.sans}`, text),
    document.fonts.load(`650 16px ${fonts.sans}`, text),
    document.fonts.load(`900 12px ${fonts.sans}`, "B4GAMBLE"),
    model.sentence ? document.fonts.load(`italic 400 35px ${fonts.serif}`, model.sentence) : Promise.resolve([]),
  ]).catch(() => undefined);
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d");
  if (!measure) throw new Error("PROGRAMME_KEEPSAKE_CANVAS_UNAVAILABLE");
  const height = Math.ceil(compose(measure, model, fonts, false));
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PROGRAMME_KEEPSAKE_CANVAS_UNAVAILABLE");
  context.scale(SCALE, SCALE);
  compose(context, model, fonts, true, height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PROGRAMME_KEEPSAKE_IMAGE_FAILED")), "image/png"));
}

/** The font families the card is set in, read from the page so the picture matches the screen. */
export function keepsakeFonts(element: Element | null): KeepsakeFonts {
  const style = element ? getComputedStyle(element) : null;
  return {
    sans: style?.getPropertyValue("--font-seven-sans").trim() || "Arial",
    serif: style?.getPropertyValue("--font-seven-serif").trim() || "Georgia",
  };
}

/**
 * Hands the picture to the person: the share sheet with the file on a touch device that offers it,
 * otherwise a download. Returns what happened; a share the person closed is not a failure.
 */
export async function deliverKeepsakeImage(blob: Blob, fileName: string): Promise<"shared" | "downloaded" | "dismissed"> {
  const file = new File([blob], fileName, { type: "image/png" });
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "dismissed";
      // The sheet could not open: the file is still given as a download.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return "downloaded";
}
