function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type HtmlTag = {
  closing: boolean;
  name: string;
  raw: string;
  selfClosing: boolean;
};

type HtmlElement = {
  end: number;
  start: number;
  startTag: string;
};

const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function htmlTagAt(html: string, index: number): HtmlTag | null {
  const match = /^<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/.exec(html.slice(index));
  if (!match) return null;
  const name = match[1].toLowerCase();
  return {
    closing: match[0][1] === "/",
    name,
    raw: match[0],
    selfClosing: match[0].endsWith("/>") || VOID_ELEMENTS.has(name),
  };
}

function htmlElementEnd(html: string, start: number) {
  const first = htmlTagAt(html, start);
  if (!first || first.closing) return -1;
  if (first.selfClosing) return start + first.raw.length;

  let depth = 1;
  let cursor = start + first.raw.length;
  while (cursor < html.length) {
    const next = html.indexOf("<", cursor);
    if (next < 0) return -1;
    if (html.startsWith("<!--", next)) {
      const commentEnd = html.indexOf("-->", next + 4);
      cursor = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }
    const tag = htmlTagAt(html, next);
    if (!tag) {
      cursor = next + 1;
      continue;
    }
    if (tag.name === first.name) {
      if (tag.closing) depth -= 1;
      else if (!tag.selfClosing) depth += 1;
      if (depth === 0) return next + tag.raw.length;
    }
    cursor = next + tag.raw.length;
  }
  return -1;
}

function htmlAncestorsAt(html: string, target: number): HtmlElement[] {
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/g;
  const stack: Array<{ name: string; start: number; startTag: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(html)) && match.index < target) {
    const tag = htmlTagAt(html, match.index);
    if (!tag) continue;
    if (tag.closing) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].name !== tag.name) continue;
        stack.splice(index, 1);
        break;
      }
    } else if (!tag.selfClosing) {
      stack.push({ name: tag.name, start: match.index, startTag: tag.raw });
    }
  }
  return stack.map((entry) => ({
    end: htmlElementEnd(html, entry.start),
    start: entry.start,
    startTag: entry.startTag,
  })).filter((entry) => entry.end > entry.start);
}

function removeElementContaining(
  html: string,
  marker: string,
  predicate: (elementHtml: string, startTag: string) => boolean,
  occurrence: "first" | "last" = "first",
) {
  const markerIndex = occurrence === "first" ? html.indexOf(marker) : html.lastIndexOf(marker);
  if (markerIndex < 0) return html;
  const ancestors = htmlAncestorsAt(html, markerIndex);
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const element = ancestors[index];
    const elementHtml = html.slice(element.start, element.end);
    if (predicate(elementHtml, element.startTag)) {
      return html.slice(0, element.start) + html.slice(element.end);
    }
  }
  return html;
}

/**
 * Generated handoff pages are content sources, never owners of application chrome.
 * Remove their captured prototype header/footer elements before React mounts the
 * shared public or protected shell. This is intentionally structural rather than a
 * CSS display override, so duplicate navigation is absent from the rendered DOM.
 */
export function stripHandoffGlobalChrome(html: string) {
  const hadCapturedNavigation = /<[^>]+\sdata-nav(?:=|\s|>)/.test(html);
  let output = removeElementContaining(
    html,
    "data-nav",
    (_elementHtml, startTag) => /\sdata-nav(?:=|\s|>)/.test(startTag),
  );

  if (!hadCapturedNavigation) {
    output = removeElementContaining(
      output,
      "B4GAMBLE",
      (elementHtml) => (
        elementHtml.includes("Start Programme")
        && elementHtml.includes("Best Offers")
        && elementHtml.includes("Casinos")
        && elementHtml.includes("Bonuses")
        && elementHtml.includes("Learn")
      ) || (elementHtml.includes("Protected support") && elementHtml.includes("Back to site")),
    );
  }

  output = removeElementContaining(
    output,
    "Independent reviews.",
    (elementHtml, startTag) => startTag.includes("border-top") && elementHtml.includes("B4GAMBLE"),
    "last",
  );

  const safetyFooterMarker = output.includes("Your activity here is never used for offers, rankings or ads.")
    ? "Your activity here is never used for offers, rankings or ads."
    : "BeGambleAware.org";
  output = removeElementContaining(
    output,
    safetyFooterMarker,
    (elementHtml, startTag) => startTag.includes("border-top") && (
      elementHtml.includes("18+")
      || elementHtml.includes("Your activity here is never used for offers, rankings or ads.")
    ),
    "last",
  );

  return output.replace(/data-navtheme=/g, "data-nav-theme=");
}

function buttonToLink(html: string, label: string, href: string) {
  const pattern = new RegExp(`<button([^>]*)>${escapePattern(label)}</button>`, "g");
  return html.replace(pattern, `<a href="${href}"$1>${label}</a>`);
}

export function transformCommonHandoff(html: string) {
  return buttonToLink(stripHandoffGlobalChrome(html), "Start Programme", "/program?entry=start");
}

export function transformTenStepsHandoff(html: string) {
  return buttonToLink(html, "Start Mission 01", "/program?entry=start");
}

export function transformResponsibleGamblingHandoff(html: string) {
  return [
    ["Get support", "/help"],
    ["Read the guides", "/learn/responsible-gambling"],
    ["Open Help", "/help"],
  ].reduce((output, [label, href]) => buttonToLink(output, label, href), html);
}

export function transformHelpHandoff(html: string) {
  let output = html.replace(
    /<div([^>]*)>Independent support — free, confidential, not affiliated with us<\/div>/,
    '<div id="independent-support"$1>Independent support — free, confidential, not affiliated with us</div>',
  );
  output = [
    ["Pause now", "#independent-support"],
    ["See the steps", "#independent-support"],
    ["Set up blocks", "/learn/responsible-gambling/responsible-gambling-tools"],
    ["Write to us", "/contact"],
  ].reduce((result, [label, href]) => buttonToLink(result, label, href), output);
  output = output
    .replace(
      /<span style="font-size: 15px; color: rgb\(250, 250, 247\); border-bottom: 1px solid rgba\(250, 250, 247, 0\.4\); padding-bottom: 3px; white-space: nowrap; cursor: pointer;">About the Programme →<\/span>/,
      '<a href="/10-steps" style="font-size: 15px; color: rgb(250, 250, 247); border-bottom: 1px solid rgba(250, 250, 247, 0.4); padding-bottom: 3px; white-space: nowrap; cursor: pointer;">About the Programme →</a>',
    )
    .replace(
      /<span style="cursor: pointer; border-bottom: 1px solid rgba\(250, 250, 247, 0\.3\); padding-bottom: 1px;">Privacy<\/span>/,
      '<a href="/privacy" style="cursor: pointer; border-bottom: 1px solid rgba(250, 250, 247, 0.3); padding-bottom: 1px;">Privacy</a>',
    )
    .replace(
      /<span style="cursor: pointer; border-bottom: 1px solid rgba\(250, 250, 247, 0\.3\); padding-bottom: 1px;">Terms<\/span>/,
      '<a href="/terms" style="cursor: pointer; border-bottom: 1px solid rgba(250, 250, 247, 0.3); padding-bottom: 1px;">Terms</a>',
    )
    .replace(
      /<div style="display: flex; justify-content: space-between; gap: 16px; padding: 18px 0px; border-bottom: 1px solid rgba\(250, 250, 247, 0\.12\); font-size: 15px;"><span style="font-weight: 600;">GamCare<\/span><span style="color: rgba\(250, 250, 247, 0\.7\); white-space: nowrap;">0808 8020 133<\/span><\/div>/,
      '<a aria-label="GamCare — independent support (opens an external site in a new tab)" href="https://www.gamcare.org.uk/get-support/" rel="noopener noreferrer" target="_blank" style="display: flex; justify-content: space-between; gap: 16px; padding: 18px 0px; border-bottom: 1px solid rgba(250, 250, 247, 0.12); font-size: 15px; color: inherit; text-decoration: none;"><span style="font-weight: 600;">GamCare</span><span style="color: rgba(250, 250, 247, 0.7); white-space: nowrap;">0808 8020 133</span></a>',
    );
  return output;
}

export function transformNotFoundHandoff(html: string) {
  return html.replace(
    /<div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: clamp\(120px, 18vw, 240px\); line-height: 0\.9; letter-spacing: -0\.02em;">404<\/div>/,
    '<h1 style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: clamp(120px, 18vw, 240px); line-height: 0.9; letter-spacing: -0.02em; margin: 0px;">404</h1>',
  );
}
