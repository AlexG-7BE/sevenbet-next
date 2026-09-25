import { articlePath, type PublicArticle } from "@/lib/articles/article-types";
import { learnStartHereSelection } from "@/lib/articles/learn-selection";
import { HOME_SOURCE_COPY, homeTranslation } from "@/lib/i18n/home-catalog";
import { learningMessages, localizedLearningCategories } from "@/lib/i18n/learning-center";
import { TEN_STEPS_SOURCE_COPY, tenStepsTranslation } from "@/lib/i18n/static-pages/ten-steps";
import type { MethodologyMessages } from "@/lib/i18n/static-pages/methodology";
import type { PublicErrorMessages } from "@/lib/i18n/public-errors";
import type { SupportedLocale } from "@/lib/market/registry";

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function translateHtmlTextNodes(html: string, translations: ReadonlyMap<string, string>) {
  const replacements = [...translations.entries()].sort(([left], [right]) => right.length - left.length);
  return html.replace(/>([^<>]+)</g, (match, text: string) => {
    let translated = text;
    for (const [source, replacement] of replacements) {
      translated = translated.replaceAll(escapeHtml(source), escapeHtml(replacement));
    }
    return `>${translated}<`;
  });
}

function qualifyUnsupportedHandoffClaims(html: string) {
  const replacements: Array<[string, string]> = [
    ["Delete everything, any time, in one action.", "Request export or deletion through account support; legal and backup retention may apply."],
    ["Tested with real money — our own.", "Review evidence and limitations are disclosed."],
    ["Funded by commission, never shaped by it.", "We may earn commission; affiliate compensation does not determine Editor Score or natural editorial ranking."],
    ["No sponsored guides", "Educational guides · commercial links disclosed"],
    ["Updated weekly", "Publication dates shown on every guide"],
    ["Every score on this site traces back to a test we ran with our own money. This page shows the whole machine — including its limits.", "Every published score should be read with its dated source status and limitations. This page explains the evaluation framework and what current records can — and cannot — establish."],
    ["One cycle. Every casino. No exceptions.", "One framework. Evidence disclosed."],
    ["Every operator on this site went through the same evaluation cycle: an ordinary player account, our own money, and at least four weeks of observation before a single word is published. No press accounts, no operator assistance, no shortcuts for anyone.", "Published reviews use the evidence available for that operator and disclose important limitations. The public record, material terms, payment information and support evidence are assessed consistently; a review is not a guarantee of future operator behaviour."],
    ["The cycle produces raw records — deposit and withdrawal timestamps, transcribed terms, support transcripts — which we keep for at least 24 months after publication. Every claim in a review traces back to one of them.", "Where test or source records exist, dated findings and material limitations should be traceable to them. Record retention follows the applicable operational and legal schedule rather than an unqualified public promise."],
    ["Real accounts, real deposits", "Source and test status"],
    ["We register through the standard public flow and fund the account with amounts typical of recreational play in that market. KYC is completed with genuine documents; the elapsed time and every repeated document request are logged as friction data.", "A review identifies whether a finding comes from a public source, operator material or a dated test record. Missing evidence is not inferred and current jurisdiction eligibility must be checked separately."],
    ["Three withdrawal methods, four weeks", "Payments and withdrawals"],
    ["At least three withdrawals per casino — card, e-wallet and bank transfer where supported, at varied amounts including one near the stated minimum. The slowest verified time defines the published payout range; a single good day never earns a good score. \"Reverse withdrawal\" prompts inviting you to cancel a pending payout are recorded and scored against the operator.", "Published payout information identifies its source and date where available. Times can vary by method, amount, verification, account history and jurisdiction; unavailable evidence remains unavailable."],
    ["Wagering base, weighting schedules, max stakes, win caps, expiry and exclusions are transcribed from the operator's live T&amp;Cs and re-verified within 72 hours of publication. We recalculate the real turnover a bonus demands and publish it in euros, not multipliers.", "Material terms include the wagering base, game weighting, maximum stake, win caps, expiry and exclusions. Current operator terms remain authoritative and must be checked before acting."],
    ["Support and games, tested at 3 a.m.", "Support and game information"],
    ["We ask real term questions at unsociable hours and cross-check answers against the written rules. Twelve slot titles per casino are spot-checked for reduced-RTP variants against the supplier's published defaults; live tables are played at two stake levels minimum.", "Support information and game data are compared with published rules where evidence is available. Availability, RTP variants and service levels can change and are not inferred from missing records."],
    ["Judgement, informed by tests.", "Judgement, informed by evidence."],
    ["The Editor Score is editorial judgement grounded in test results — not the output of a fixed arithmetic formula, and no percentage weighting should be inferred from it.", "The Editor Score is editorial judgement grounded in available evidence — not the output of a fixed arithmetic formula, and no percentage weighting should be inferred from it."],
    ["The #1 pick is the casino with the strongest current combination of verified payout results and realistic bonus net value — the interval we measured, applied to the terms we transcribed. It changes when the evidence changes: not on a schedule, not in rotation, and never because of a commercial negotiation.", "When eligible published records exist, the #1 pick reflects the strongest current combination under the disclosed ranking method. Missing or incomplete evidence fails closed, and the selection can change when authoritative data changes."],
    ["There is no mechanism, at any price, by which an operator can buy a position.", "Affiliate compensation does not determine Editor Score or natural editorial ranking."],
    ["Scores and reviews are finished before commercial terms are discussed. The people who negotiate partnerships have no editing access to reviews; the people who write reviews are not told operator-specific commission rates until after a score is locked.", "Editorial scoring and commercial availability are separate application concerns. Affiliate compensation does not determine Editor Score or natural editorial ranking."],
    ["Corrections ship within 48 hours of verification.", "Verified corrections are reviewed and dated when published."],
    ["Raw test records are retained for 24 months after the review they support.", "Source and test records follow the applicable operational and legal retention schedule."],
    ["Reviews built on real-money tests and guides that explain the fine print. Everything dated, everything correctable, nothing sponsored.", "Reviews identify their current evidence and limitations; guides explain material terms in plain language."],
    ["That's the whole model — no paid placements, no sponsored scores, no selling data.", "Commercial links may generate commission. Affiliate compensation does not determine Editor Score or natural editorial ranking."],
    ["Commission may fund us. It never sets a score. Here is exactly where the line runs.", "Commission may fund us. Affiliate compensation does not determine Editor Score or natural editorial ranking. Here is where the product boundary runs."],
    ["We do not sell paid placements, sponsored reviews, advertising slots or user data.", "This service uses disclosed affiliate links. Current product controls separate commercial actions from editorial scoring and Programme or Help data."],
    ["Scores are locked before commercial terms are discussed; reviewers are not told operator-specific commission rates before a score is final. Several operators from whom we earn nothing outrank operators from whom we do.", "Affiliate compensation does not determine Editor Score or natural editorial ranking. Commercial availability and editorial presentation remain separate application concerns."],
    ["Errors are corrected within 48 hours of verification and noted in the affected text.", "Verified corrections are dated and noted in the affected text when published."],
    ["A 24-hour to 6-week break from all gambling content on B4GAMBLE, effective immediately.", "Open independent blocking and self-exclusion options, or step away from gambling content now."],
    ["A human from our team, within 24 hours. Your message never touches the commercial side.", "Contact the B4GAMBLE team. Protected Help activity is not used for offers, rankings or commercial personalisation."],
    ["we collect the minimum needed to run the service, and we never sell personal data.", "the service limits collection to the purposes described below. Contact the controller for data-rights questions."],
    ["Basic analytics: pages visited, approximate region, device type.", "Non-essential product analytics is disabled for the GB launch. Necessary operational records support security and requested features."],
    ["Optional analytics cookies are off until you accept them.", "Non-essential analytics and advertising trackers are off; necessary storage supports requested features, authentication and security."],
    ["Export or delete your account and all saved Programme data at any time, in one action, from your dashboard. Deletion is immediate and irreversible.", "Contact us to request an export or deletion of account and saved Programme data. Legal, fraud-prevention and backup retention may continue where applicable."],
    ["Account data is kept while the account exists; analytics are aggregated after 14 months. Data is encrypted in transit and at rest. If a breach ever affects you, we notify you directly and without delay.", "Account and security records are retained only for the applicable service, legal and security purposes. Non-essential product analytics is disabled. Security and incident handling follow the controls and notification duties that apply to the service and its processors."],
    ["We test with real money and update reviews continuously, but casino terms change without notice.", "Reviews disclose their current source status and date where available, but casino terms can change without notice."],
    ["A private 10-step programme", "A self-directed 10-step programme"],
    ["Free and private.", "Free to use. Privacy explained."],
    ["When you're ready — not before — a private 10-step plan is here.", "When you're ready — not before — a self-directed 10-step plan is here."],
    ["Independent reviews. Real tests.", "Editorial reviews. Evidence and limitations disclosed."],
    ["A free, private 10-step plan for staying in control. No paywall, no upsell, and nothing you say inside it ever touches the commercial side.", "A free-to-use, self-directed 10-step Programme. Programme data is not used for commercial targeting, offers or rankings."],
    ["Three things in one product: a free private control Programme, independent casino research funded by real-money testing, and openly commercial discovery pages (Best Offers, Casinos, Bonuses) whose affiliate links pay us commission.", "Three parts with clear boundaries: a free-to-use self-directed Programme, editorial casino information with disclosed evidence and limitations, and commercial discovery pages whose clearly labelled affiliate links may pay us commission."],
    ["Last-verified date visible next to every score.", "Evidence dates and limitations shown where the published record supports them."],
    ["The same wall protects you in the other direction: Programme and Help activity is never used to target offers, personalise rankings or feed advertising — it stays on its side of the product, permanently.", "Programme and Help activity is not used to target offers, personalise rankings or feed advertising. Current product controls keep those purposes separate."],
    ["A review is only as good as its date. Every published review carries the day its material facts were last verified, and re-verification runs on a rolling basis — immediately when credible information suggests an operator changed behaviour or terms.", "A review is only as useful as its source status and date. Published records show evidence dates where available, and credible corrections are assessed against authoritative sources."],
    ["Material term changes trigger a re-review and a noted correction in the affected text.", "Material term changes should be reviewed and the affected text dated when corrected."],
    ["Spotted an error? Tell us — reports are logged, triaged and answered.", "Spotted an error? Contact us with the page and supporting source so it can be assessed."],
    ["Our findings are observations of operator behaviour at particular moments, from particular jurisdictions, with particular payment instruments and amounts — snapshots, not guarantees.", "Findings reflect the disclosed sources or dated observations available for a particular jurisdiction and context — snapshots, not guarantees."],
    ["Some findings act as caps, not weights: an unresolved verified non-payment, a withdrawal we couldn't complete during the observation window, or marketing that misrepresents the operator's own terms means no recommendation — regardless of how good everything else looks.", "Some substantiated findings can cap an assessment rather than add weight, including unresolved non-payment evidence, material withdrawal failure or marketing that misrepresents operator terms."],
  ];
  return replacements.reduce((output, [claim, replacement]) => output.replaceAll(claim, replacement), html);
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

function transformElementContaining(
  html: string,
  marker: string,
  predicate: (elementHtml: string, startTag: string) => boolean,
  transform: (elementHtml: string, startTag: string) => string,
  occurrence: "first" | "last" = "first",
) {
  const markerIndex = occurrence === "first" ? html.indexOf(marker) : html.lastIndexOf(marker);
  if (markerIndex < 0) return html;
  const ancestors = htmlAncestorsAt(html, markerIndex);
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const element = ancestors[index];
    const elementHtml = html.slice(element.start, element.end);
    if (!predicate(elementHtml, element.startTag)) continue;
    return html.slice(0, element.start) + transform(elementHtml, element.startTag) + html.slice(element.end);
  }
  return html;
}

function retagElement(elementHtml: string, startTag: string, name: string, attributes: string) {
  const tag = htmlTagAt(startTag, 0);
  if (!tag || tag.closing || tag.selfClosing) return elementHtml;
  const closingTag = `</${tag.name}>`;
  if (!elementHtml.endsWith(closingTag)) return elementHtml;
  const transformedStartTag = startTag
    .replace(/^<([a-zA-Z][\w:-]*)/, `<${name}`)
    .replace(/>$/, ` ${attributes}>`);
  return `${transformedStartTag}${elementHtml.slice(startTag.length, -closingTag.length)}</${name}>`;
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

function capturedLinkToRoute(html: string, label: string, href: string) {
  const pattern = new RegExp(`<a href="#"([^>]*)>${escapePattern(label)}</a>`, "g");
  return html.replace(pattern, `<a href="${href}"$1>${label}</a>`);
}

export function transformCommonHandoff(html: string, programmePath = "/program") {
  const programmeEntryHref = `${programmePath}?entry=start`;
  const output = buttonToLink(qualifyUnsupportedHandoffClaims(stripHandoffGlobalChrome(html)), "Start Programme", programmeEntryHref)
    .replaceAll('href="/program?entry=start"', `href="${escapeHtml(programmeEntryHref)}"`)
    .replaceAll('href="/program"', `href="${escapeHtml(programmePath)}"`);
  return [
    ["Full affiliate disclosure →", "/affiliate-disclosure"],
    ["Methodology", "/methodology"],
    ["Tell us", "/contact"],
    ["tell us", "/contact"],
  ].reduce((current, [label, href]) => capturedLinkToRoute(current, label, href), output);
}

/**
 * Keep the Learn hero and its metadata on the same bounded editorial axis as
 * the first real content section. The data hooks let application CSS own that
 * relationship without rewriting any captured copy or visual treatment.
 */
const LEARN_PROGRAMME_BRIDGE_AFTER = 6;

/** Inline Programme card inside the Learn guide list; the hub's own translated bridge copy (hub[20..24]). */
function learnProgrammeBridgeHtml(hub: readonly string[], programmeHref: string) {
  const [eyebrow, lead, emphasis, body, action] = [hub[20], hub[21], hub[22], hub[23], hub[24]].map((value) => escapeHtml(value ?? ""));
  return `<aside data-learn-programme-bridge="inline" aria-label="${eyebrow}" style="background: rgb(23, 22, 22); color: rgb(250, 250, 247); border-radius: 14px; padding: 28px 30px; display: flex; align-items: center; gap: 20px 32px; flex-wrap: wrap;">
            <div style="flex: 1 1 320px; min-width: 0;">
              <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: rgb(228, 226, 78); margin-bottom: 10px;">${eyebrow}</div>
              <div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: 22px; line-height: 1.15;">${lead} <em style="font-family: &quot;Instrument Serif&quot;, serif; font-weight: 400; text-transform: none; color: rgb(228, 226, 78);">${emphasis}</em></div>
              <p style="font-size: 15px; line-height: 1.55; color: rgba(250, 250, 247, 0.7); margin: 10px 0px 0px;">${body}</p>
            </div>
            <a href="${programmeHref}" data-learn-programme-bridge-action="" style="min-height: 48px; display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px; border-radius: 3px; background: rgb(228, 226, 78); color: rgb(16, 15, 15); font: 700 16px Archivo, sans-serif; text-decoration: none; white-space: nowrap;">${action}</a>
          </aside>`;
}

export type LearnOfferBridgeCopy = Readonly<{
  title: string;
  body: string;
  bonusesLabel: string;
  bestOffersLabel: string;
  disclosure: string;
  bonusesHref: string;
  bestOffersHref: string;
}>;

/** Bridge from bonus education to the public offer pages, with the commercial disclosure beside the links. */
export function learnOfferBridgeHtml(copy: LearnOfferBridgeCopy) {
  const text = (value: string) => escapeHtml(value);
  return `<aside data-learn-offer-bridge="" aria-label="${text(copy.title)}" style="margin: 56px 0px 0px; padding: 28px 30px; border-radius: 20px; background: rgb(16, 15, 15); color: rgb(250, 250, 247);">
          <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: rgb(228, 226, 78); font-weight: 600; margin-bottom: 12px;">${text(copy.title)}</div>
          <p style="margin: 0px 0px 20px; font-size: 17px; line-height: 1.55; color: rgba(250, 250, 247, 0.85);">${text(copy.body)}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <a href="${text(copy.bonusesHref)}" data-learn-offer-bridge-link="bonuses" style="min-height: 48px; display: inline-flex; align-items: center; padding: 12px 22px; border-radius: 3px; background: rgb(228, 226, 78); color: rgb(16, 15, 15); font: 700 16px Archivo, sans-serif; text-decoration: none;">${text(copy.bonusesLabel)} →</a>
            <a href="${text(copy.bestOffersHref)}" data-learn-offer-bridge-link="best-offers" style="min-height: 48px; display: inline-flex; align-items: center; padding: 12px 22px; border: 1px solid rgba(250, 250, 247, 0.5); border-radius: 3px; color: rgb(250, 250, 247); font: 700 16px Archivo, sans-serif; text-decoration: none;">${text(copy.bestOffersLabel)} →</a>
          </div>
          <p style="margin: 16px 0px 0px; font-size: 14px; line-height: 1.5; color: rgba(250, 250, 247, 0.6);">${text(copy.disclosure)}</p>
        </aside>`;
}

export function transformLearnHandoff(
  html: string,
  locale: SupportedLocale = "en-GB",
  hrefFor: (href: string) => string = (href) => href,
  articles: readonly PublicArticle[] = [],
  programmePath = "/program",
) {
  const messages = learningMessages(locale);
  const categories = localizedLearningCategories(locale);
  const categoryTitles = new Map(categories.map((category) => [category.slug, category.title]));
  const topicFor = (article: PublicArticle) => {
    if (article.category === "casino-bonuses") return "bonuses";
    if (["payments", "crypto-casinos"].includes(article.category)) return "banking";
    if (["game-guides", "sports-betting-basics"].includes(article.category)) return "games";
    if (article.category === "responsible-gambling") return "responsible play";
    if (article.category === "industry-news") return "industry";
    return "casinos";
  };
  const updated = (article: PublicArticle) => new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(article.updatedAt));
  const startCard = (article: PublicArticle) => `<a href="${escapeHtml(hrefFor(articlePath(article)))}" data-learn-category="${topicFor(article)}" class="scp2" style="background: rgb(244, 241, 235); border: 1px solid rgba(16, 15, 15, 0.1); border-radius: 20px; padding: 32px 36px; display: flex; flex-direction: column; color: inherit; text-decoration: none; cursor: pointer; transition: box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1);">
          <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: rgb(90, 89, 0); font-weight: 600; margin-bottom: 16px;">${escapeHtml(categoryTitles.get(article.category) || article.category.replaceAll("-", " "))}</div>
          <div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: 22px; line-height: 1.2; margin-bottom: 12px;">${escapeHtml(article.title)}</div>
          <p style="font-size: 14px; line-height: 1.6; color: rgb(100, 99, 92); margin: 0px 0px 20px; flex: 1 1 0%;">${escapeHtml(article.excerpt)}</p>
          <div style="font-size: 13px; color: rgb(94, 93, 87);">${escapeHtml(article.readingTime || "Guide")} · ${escapeHtml(messages.ui.updated)} ${updated(article)}</div>
        </a>`;
  const guideCard = (article: PublicArticle) => `<a href="${escapeHtml(hrefFor(articlePath(article)))}" data-learn-category="${topicFor(article)}" class="scp3" style="background: rgb(250, 250, 247); border: 1px solid rgba(16, 15, 15, 0.1); border-radius: 14px; padding: 24px 30px; display: flex; align-items: center; gap: 20px 32px; flex-wrap: wrap; color: inherit; text-decoration: none; cursor: pointer; transition: box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1);">
            <div style="flex: 1 1 0%; min-width: 260px;">
              <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: rgb(90, 89, 0); font-weight: 600; margin-bottom: 6px;"><span class="sc-interp">${escapeHtml(categoryTitles.get(article.category) || article.category.replaceAll("-", " "))}</span></div>
              <div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: 19px; line-height: 1.25;"><span class="sc-interp">${escapeHtml(article.title)}</span></div>
              <div style="font-size: 14px; color: rgb(100, 99, 92); margin-top: 6px;"><span class="sc-interp">${escapeHtml(article.excerpt)}</span></div>
            </div>
            <div style="font-size: 13px; color: rgb(94, 93, 87); white-space: nowrap;"><span class="sc-interp">${escapeHtml(article.readingTime || "Guide")} · ${updated(article)}</span></div>
            <span style="font-size: 14px; color: rgb(16, 15, 15); border-bottom: 1px solid rgba(16, 15, 15, 0.3); padding-bottom: 2px; white-space: nowrap;">${escapeHtml(messages.hub[19])}</span>
          </a>`;
  let output = html
    .replace(/<input placeholder="Search guides — wagering, payouts, RTP…"[^>]*>/, "")
    .replace(
      /(<h2[^>]*>All guides<\/h2>)/,
      `$1<label data-learn-discovery-search=""><span>${escapeHtml(messages.hub[10])}</span><input type="search" aria-label="${escapeHtml(messages.hub[10])}" placeholder="${escapeHtml(messages.ui.searchPlaceholder)}" value=""></label>`,
    )
    .replace('data-mob="pad"', 'data-mob="pad" data-learn-hero-axis=""')
    .replace(
      '<div style="position: relative; display: flex; gap: 24px 56px; flex-wrap: wrap; align-items: center; padding: 26px clamp(24px, 5vw, 72px);',
      '<div data-learn-meta-axis="" style="position: relative; display: flex; gap: 24px 56px; flex-wrap: wrap; align-items: center; padding: 26px clamp(24px, 5vw, 72px);',
    )
    .replace(
      '<div style="background: rgb(250, 250, 247); color: rgb(16, 15, 15); padding: 100px clamp(24px, 5vw, 72px);">\n    <div data-reveal="" style="max-width: 1440px; margin: 0px auto;">',
      '<div data-learn-start-section="" style="background: rgb(250, 250, 247); color: rgb(16, 15, 15); padding: 100px clamp(24px, 5vw, 72px);">\n    <div data-learn-start-axis="" data-reveal="" style="max-width: 1440px; margin: 0px auto;">',
    )
    .replace(
      '<div style="background: rgb(244, 241, 235); color: rgb(16, 15, 15); padding: 100px clamp(24px, 5vw, 72px) 120px; border-top: 1px solid rgba(16, 15, 15, 0.08);">\n    <div data-reveal="" style="max-width: 1440px; margin: 0px auto;">',
      '<div data-learn-catalogue-section="" style="background: rgb(244, 241, 235); color: rgb(16, 15, 15); padding: 100px clamp(24px, 5vw, 72px) 120px; border-top: 1px solid rgba(16, 15, 15, 0.08);">\n    <div data-learn-catalogue-axis="" data-reveal="" style="max-width: 1440px; margin: 0px auto;">',
    )
    .replace(
      '<div style="display: grid; gap: 12px;">',
      '<div data-learn-grid="" style="display: grid; gap: 12px;">',
    );
  output = output.replace(
    /<div data-learn-meta-axis=""[^>]*>[\s\S]*?<\/div>/,
    (meta) => meta.replaceAll("<span ", '<span data-learn-meta-item="" '),
  );
  // Founder decision 25 Sep 2026 (package C): Start here is one guide per topic, and All guides never repeats it.
  const featured = learnStartHereSelection(articles);
  const featuredIds = new Set(featured.map((article) => article.id));
  let featuredIndex = 0;
  output = output.replace(/<a href="[^"]+" class="scp2"[\s\S]*?<\/a>/g, () => {
    const article = featured[featuredIndex++];
    return article ? startCard(article) : "";
  });
  const guideCards = articles.filter((article) => !featuredIds.has(article.id)).map(guideCard);
  // Founder decision 25 Sep 2026: the Programme is offered after the first six guides as well as at the end.
  if (guideCards.length > LEARN_PROGRAMME_BRIDGE_AFTER) {
    guideCards.splice(LEARN_PROGRAMME_BRIDGE_AFTER, 0, learnProgrammeBridgeHtml(messages.hub, escapeHtml(`${programmePath}?entry=start`)));
  }
  const guides = guideCards.join("\n        ");
  let replacedGuideList = false;
  output = output.replace(/<a href="[^"]+" class="scp3"[\s\S]*?<\/a>/g, () => {
    if (replacedGuideList) return "";
    replacedGuideList = true;
    return guides;
  });
  if (!articles.length) {
    output = output
      .replace('<div data-learn-start-section=""', '<div hidden data-learn-start-section=""')
      .replace('<div data-learn-catalogue-axis="" data-reveal=""', '<div data-learn-catalogue-axis=""');
    output = output.replace(
      /(<h2[^>]*>All guides<\/h2>)/,
      `$1<p data-learn-empty="" role="status" style="margin:28px 0 0;color:rgb(100,99,92);font-size:16px;line-height:1.6;">${escapeHtml(messages.emptyState)}</p>`,
    );
  }
  output = output.replace(
    /<span class="sc-interp">11<\/span> guides/,
    `<span class="sc-interp">${articles.length}</span> ${escapeHtml(messages.hub[11])}`,
  );
  output = output.replace(/<h2([^>]*)>All guides<\/h2>/, '<h2$1 data-learn-all-guides="">All guides</h2>');
  const topicIds = ["all topics", "bonuses", "banking", "casinos", "games", "responsible play", "industry"];
  const topicLabels = ["All topics", "Bonuses", "Banking", "Casinos", "Games", "Responsible play", "Industry"];
  output = output.replace(/<button([^>]*)>([\s\S]*?)<\/button>/g, (button, attributes: string, content: string) => {
    const label = content.replace(/<[^>]+>/g, "").trim();
    const topicIndex = topicLabels.indexOf(label);
    return topicIndex < 0 ? button : `<button${attributes} data-learn-topic="${topicIds[topicIndex]}">${content}</button>`;
  });
  output = translateHtmlTextNodes(output, messages.hubCopy);
  const i18nData = `<span hidden data-learn-i18n data-learn-one="${escapeHtml(messages.ui.oneShown)}" data-learn-many="${escapeHtml(messages.ui.manyShown)}" data-learn-none="${escapeHtml(messages.ui.noneShown)}"></span>`;
  return i18nData + output;
}

export function transformMethodologyHandoff(
  html: string,
  messages: MethodologyMessages,
  hrefFor: (href: string) => string = (href) => href,
) {
  let output = html;
  output = translateHtmlTextNodes(output, messages.copy);
  output = output.replace(
    /(<div style="display: flex; gap: 14px;"><span[^>]*>[^<]*<\/span>)([\s\S]*?)(<\/div>)/g,
    '$1<span data-methodology-list-copy="" style="min-width: 0; overflow-wrap: anywhere;">$2</span>$3',
  );
  return output
    .replaceAll('href="/contact"', `href="${escapeHtml(hrefFor("/contact"))}"`)
    .replaceAll('href="/methodology"', `href="${escapeHtml(hrefFor("/methodology"))}"`);
}

/** A real published guide in the Bonus Guide's "Read next" row: dark ink on the cream card, never acid. */
function bonusGuideReadNextCard(article: PublicArticle, categoryTitle: string) {
  return `<a href="${escapeHtml(articlePath(article))}" class="scp2" data-bonus-guide-read-next="" style="display: block; background: rgb(250, 250, 247); border: 1px solid rgba(16, 15, 15, 0.1); border-radius: 20px; padding: 32px 36px; color: rgb(16, 15, 15); text-decoration: none; transition: box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1);">
            <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: rgb(90, 89, 0); font-weight: 600; margin-bottom: 16px;">${escapeHtml(categoryTitle)}</div>
            <div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: 21px; line-height: 1.2; margin-bottom: 14px; color: rgb(16, 15, 15);">${escapeHtml(article.title)}</div>
            <div style="font-size: 13px; color: rgb(100, 99, 92);">${escapeHtml(article.readingTime || "Guide")}</div>
          </a>`;
}

export function transformBonusGuideHandoff(html: string, options: Readonly<{
  offerBridge?: LearnOfferBridgeCopy | null;
  /** Real published English guides, already selected (`bonusGuideReadNextSelection`). None renders no Read next row. */
  readNext?: readonly PublicArticle[];
}> = {}) {
  const replacements: Array<[string, string]> = [
    ["What 35x actually costs you, when a smaller bonus is the better deal, and the three terms that quietly decide everything.", "How wagering changes required turnover, why a smaller bonus can require less play, and which material terms to check first."],
    ["By the B4GAMBLE test team", "By the B4GAMBLE editorial team"],
    ["Updated Aug 2026", "Reviewed Aug 2026"],
    ["Not sponsored · real-money tested", "Educational examples · not current offers"],
    ["What 35x really means", "The hypothetical 35x example"],
    ["The maths on a real offer", "Comparing fictional examples"],
    ["Game weighting — the quiet tax", "Game weighting"],
    ["When smaller wins", "Comparing turnover"],
    ["A casino advertises «100% up to €200». The number everyone reads is 200. The number that decides what you keep is printed two clicks deeper: <strong>35x wagering</strong>.", "A fictional cross-market example advertises «100% up to €200». The headline is 200; the term that changes the required play is <strong>35x wagering</strong>."],
    ["Wagering requirements are the total amount you must bet before bonus money becomes withdrawable. They are not a scam — they are the price of the bonus. The problem is that the price is quoted in a currency most players never convert.", "Wagering requirements are the total amount that must be bet before bonus funds become withdrawable. Convert the requirement into turnover and check the operator's current terms before accepting any bonus."],
    ["«35x» applies to the bonus amount — sometimes to bonus", "In this fictional example, «35x» applies to the bonus amount — in some markets a requirement may instead apply to bonus"],
    ["Take the €200 bonus at 35x on bonus only:", "Take a fictional €200 bonus at 35x on bonus only:"],
    ["Expected loss at 96% RTP slots", "Simplified theoretical loss at 96% RTP"],
    ["Expected value of the «free» €200", "Bonus less simplified theoretical loss"],
    ["Statistically, clearing this bonus on standard slots costs more than the bonus is worth. That is not an accident of one operator — it is how 35x is designed to work at typical RTP.", "This simplified expected-value illustration excludes variance, game weighting, maximum bets, win caps, expiry and other restrictions. It is not a prediction of an individual outcome."],
    ["«A bonus is a loan you repay in turnover. Read the interest rate first.»", "«Convert the requirement into turnover before accepting a bonus.»"],
    ["Three offers from our current test set, converted to the same currency — expected cost of clearing:", "These fictional records show why the wagering base and multiplier matter. They are not current promotions or test results:"],
    ["<span>Offer</span>", "<span>Example</span>"],
    ["<span>Exp. cost</span>", "<span>Simplified value</span>"],
    ["«€200 + 100 spins»", "«Fictional €200 example»"],
    ["«€50 low-wager»", "«Fictional €50 example»"],
    ["«€500 mega match»", "«Fictional €500 example»"],
    ["The €50 offer beats the €500 one by four figures. Headline size and player value are close to uncorrelated — which is why our rankings ignore the headline entirely.", "A larger headline can still require much more turnover. Compare every current material term rather than treating these illustrative values as an offer ranking."],
    ["Slots usually count 100% towards wagering. Blackjack often counts 10%, roulette 20%, some games 0%. Clear a 35x requirement on blackjack at 10% weighting and your effective requirement is <strong>350x</strong>.", "Operator terms may assign different contribution rates to different games. In a fictional 35x example, a 10% game contribution would require the equivalent of <strong>350x</strong>; check the current weighting table before play."],
    ["Exceed it once — even accidentally — and most operators may void the bonus and winnings.", "Operator terms may permit the bonus and related winnings to be voided if the maximum bet is exceeded."],
    ["A useful rule of thumb: divide the bonus by the turnover it demands. Anything below 3% is expensive; above 8% is genuinely competitive. The best offers in our directory are almost always the modest ones with 10–15x on bonus only.", "Calculate required turnover from the bonus amount, wagering base and multiplier. A smaller headline with a lower requirement can demand less play; eligibility, game weighting, maximum bet, expiry and withdrawal restrictions still matter."],
    ["Wagering applies to bonus only — not deposit + bonus", "Check whether wagering applies to bonus only or deposit + bonus"],
    ["Turnover ÷ bonus ratio is 12.5x or better", "For GB-licensed operators, verify the requirement is no more than 10x the incentive"],
    ["Your games count at 100% weighting", "Check how your chosen games contribute"],
    ["Max bet rule found and noted", "Find and note maximum bet and win-cap rules"],
    ["Expiry gives you at least 14 days", "Check eligibility, expiry and withdrawal restrictions"],
    ["If an offer fails two or more of these, skip it. The deposit you keep is worth more than the bonus you clear.", "If material terms are missing or unclear, do not rely on the headline. Verify the current operator terms or skip the incentive."],
    ["Reviewed by two editors · sources on request", "Educational examples · current primary sources linked"],
    ["How we test →", "How ranking works →"],
  ];
  let output = replacements.reduce((current, [claim, replacement]) => current.replaceAll(claim, replacement), html);
  output = output.replace(
    '<div style="border: 1px solid rgba(16, 15, 15, 0.12); border-radius: 20px; overflow: hidden; margin: 0px 0px 28px; font-size: 15px;">',
    '<div data-bonus-guide-table="" style="border: 1px solid rgba(16, 15, 15, 0.12); border-radius: 20px; overflow: hidden; margin: 0px 0px 28px; font-size: 15px;">',
  );
  const leadEnd = "</strong>.</p>";
  const leadIndex = output.indexOf(leadEnd, output.indexOf("A fictional cross-market example"));
  if (leadIndex >= 0) {
    const insertAt = leadIndex + leadEnd.length;
    const notice = `\n        <div role="note" style="background: rgba(185, 75, 71, 0.07); border: 1px solid rgba(185, 75, 71, 0.25); border-radius: 20px; padding: 24px 28px; margin: 0px 0px 28px;"><strong style="display:block;color:rgb(167,46,42);font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px;">Current GB rule</strong><span style="font-size:15px;line-height:1.65;color:rgb(38,37,37);">For GB-licensed operators, LCCP Social Responsibility Code 5.1.1 prohibits wagering requirements over 10 times the incentive. The 35x figures below are hypothetical educational examples, not current eligible GB offers.</span></div>`;
    output = output.slice(0, insertAt) + notice + output.slice(insertAt);
  }
  const reviewMarker = '<div style="margin-top: 64px; padding-top: 32px; border-top: 3px double rgb(16, 15, 15);';
  const reviewIndex = output.indexOf(reviewMarker);
  if (reviewIndex >= 0) {
    const sources = `<div data-bonus-guide-sources="" style="margin:64px 0 28px;padding:28px;border:1px solid rgba(16,15,15,.12);border-radius:20px;background:rgb(244,241,235);"><strong style="display:block;margin-bottom:12px;font-size:14px;letter-spacing:.12em;text-transform:uppercase;">Current primary sources</strong><p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgb(38,37,37);">Current GB regulatory and advertising sources govern the statements above. The examples remain explicitly fictional and educational.</p><a aria-label="UK Gambling Commission LCCP 5.1.1 (opens in a new tab)" href="https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/5-1-1-sr-code" rel="noopener noreferrer" target="_blank" style="min-height:44px;display:flex;align-items:center;color:rgb(16,15,15);font-size:14px;">UK Gambling Commission · LCCP 5.1.1 ↗</a><a aria-label="ASA and CAP free bets and bonuses guidance (opens in a new tab)" href="https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html" rel="noopener noreferrer" target="_blank" style="min-height:44px;display:flex;align-items:center;color:rgb(16,15,15);font-size:14px;">ASA / CAP · Free bets and bonuses guidance ↗</a><small style="display:block;margin-top:10px;color:rgb(100,99,92);font-size:13px;">Checked 18 August 2026</small></div>\n        `;
    // Founder decision 25 Sep 2026: after the checklist, a bridge to current offers where they may be presented.
    const bridge = options.offerBridge ? learnOfferBridgeHtml(options.offerBridge) : "";
    output = output.slice(0, reviewIndex) + bridge + sources + output.slice(reviewIndex);
  }
  // Founder decision 25 Sep 2026 (package C): the captured "Read next" cards named guides that do not exist.
  // They are replaced by real published guides; with none, the row is removed rather than faked.
  const readNextStart = output.indexOf('<div data-screen-label="Read next"');
  const readNextEnd = readNextStart >= 0 ? htmlElementEnd(output, readNextStart) : -1;
  if (readNextEnd > readNextStart) {
    const readNext = options.readNext ?? [];
    const categoryTitles = new Map(localizedLearningCategories("en-GB").map((category) => [category.slug, category.title]));
    const section = output.slice(readNextStart, readNextEnd);
    const gridStart = section.indexOf('<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">');
    const gridEnd = gridStart >= 0 ? htmlElementEnd(section, gridStart) : -1;
    let replacement = "";
    if (readNext.length && gridEnd > gridStart) {
      const gridOpen = htmlTagAt(section, gridStart)?.raw ?? "";
      const cards = readNext.map((article) => bonusGuideReadNextCard(
        article,
        categoryTitles.get(article.category) ?? article.category.replaceAll("-", " "),
      )).join("\n          ");
      replacement = section.slice(0, gridStart)
        + gridOpen.replace("<div ", '<div data-bonus-guide-read-next-grid="" ')
        + `\n          ${cards}\n        </div>`
        + section.slice(gridEnd);
    }
    output = output.slice(0, readNextStart) + replacement + output.slice(readNextEnd);
  }
  return output;
}

/**
 * The approved Home capture grouped its footer inside the last 100svh screen.
 * Production strips that captured chrome in favour of PublicFooter, so the
 * remaining CTA must no longer retain the prototype's independent snap stop.
 */
const HOME_MEDIA: Record<string, { height: number; width: number }> = {
  "chapter-apply.jpg": { height: 4000, width: 6000 },
  "hero-confidence.jpg": { height: 6720, width: 4480 },
  "hero-creator.jpg": { height: 3844, width: 2563 },
  "hero-outcome.jpg": { height: 5301, width: 3648 },
  "hero-plan.jpg": { height: 2336, width: 3500 },
};

const HOME_MEDIA_WIDTHS = [320, 640, 1280, 1920] as const;
const HOME_GENERATED_TIMING_COPY = "10 missions · 5–15 minutes each";
const HOME_CHAPTER_ALTS = new Set(["Noticing the moment", "Writing the rule", "Applying the plan"]);
const HOME_SNAP_LABELS = new Set([
  "Hero",
  "Recognition",
  "Built from evidence",
  "Why trust",
  "Final CTA",
]);

const HOME_STICKY_SNAP_LABELS = [
  "A plan you can see",
  "Missions 01-03",
  "Missions 04-07",
  "Missions 08-10",
] as const;

function homeResponsiveImage(imageTag: string) {
  const source = /src="\/home\/([^"/]+\.jpg)"/.exec(imageTag)?.[1];
  const alt = /alt="([^"]*)"/.exec(imageTag)?.[1] ?? "";
  const media = source ? HOME_MEDIA[source] : undefined;
  if (!source || !media) return imageTag;

  const chapter = HOME_CHAPTER_ALTS.has(alt);
  const loading = chapter ? "lazy" : "eager";
  const sizes = chapter ? "100vw" : "(max-width: 1000px) 130px, 300px";
  const candidates = (format: "avif" | "webp") => HOME_MEDIA_WIDTHS
    .map((width) => `/home/responsive/${source.replace(/\.jpg$/, `-${width}.${format}`)} ${width}w`)
    .join(", ");
  const responsiveTag = imageTag
    .replace(/loading="[^"]+"/, `loading="${loading}"`)
    .replace("decoding=\"async\"", `decoding="async" fetchpriority="${chapter ? "low" : alt === "Creator at work" ? "high" : "auto"}" height="${media.height}" sizes="${sizes}" width="${media.width}"`);

  return `<picture data-home-media="${chapter ? "chapter" : "opening"}" style="display:block;width:100%;height:100%;"><source type="image/avif" sizes="${sizes}" srcset="${candidates("avif")}"><source type="image/webp" sizes="${sizes}" srcset="${candidates("webp")}">${responsiveTag}</picture>`;
}

function tagHomeHeroKicker(html: string, copy: string) {
  const escapedCopy = escapeHtml(copy);
  return html.replace(
    new RegExp(`<div([^>]*)>${escapePattern(escapedCopy)}</div>`),
    `<div$1 data-home-hero-kicker="">${escapedCopy}</div>`,
  );
}

function translateHomeHandoff(html: string, locale: SupportedLocale) {
  const translation = homeTranslation(locale);
  if (!translation) return tagHomeHeroKicker(html, HOME_SOURCE_COPY.hero[0]);

  const textTranslations = new Map<string, string>();
  for (const section of Object.keys(HOME_SOURCE_COPY) as Array<keyof typeof HOME_SOURCE_COPY>) {
    if (section === "imageAlts") continue;
    const source = HOME_SOURCE_COPY[section];
    const localized = translation[section];
    if (source.length !== localized.length) throw new Error(`Incomplete ${locale} Home translation: ${section}`);
    source.forEach((value, index) => textTranslations.set(value, localized[index]));
  }

  let output = html.replace(/>([^<>]*)</g, (match, text: string) => {
    const value = text.trim();
    const localized = textTranslations.get(value);
    if (!localized) return match;
    const leading = text.slice(0, text.indexOf(value));
    const trailing = text.slice(text.indexOf(value) + value.length);
    return `>${leading}${escapeHtml(localized)}${trailing}<`;
  });

  if (HOME_SOURCE_COPY.imageAlts.length !== translation.imageAlts.length) {
    throw new Error(`Incomplete ${locale} Home translation: imageAlts`);
  }
  HOME_SOURCE_COPY.imageAlts.forEach((source, index) => {
    output = output.replaceAll(`alt="${source}"`, `alt="${escapeHtml(translation.imageAlts[index])}"`);
  });
  return tagHomeHeroKicker(output, translation.hero[0]);
}

export function transformHomeHandoff(html: string, locale: SupportedLocale = "en-GB") {
  const transformed = html
    .replaceAll(HOME_GENERATED_TIMING_COPY, HOME_SOURCE_COPY.hero[5])
    .replaceAll("Free — no paywall inside, ever", HOME_SOURCE_COPY.hero[6])
    .replaceAll("now and always", HOME_SOURCE_COPY.programme[6])
    .replaceAll("Free — no paywall, no upsell inside missions, ever.", HOME_SOURCE_COPY.trust[4])
    .replaceAll("honest minute.", HOME_SOURCE_COPY.final[1])
    .replaceAll("One question at a time. Your starting point builds itself as you answer.", HOME_SOURCE_COPY.final[2])
    .replace(/>~2</g, `>${HOME_SOURCE_COPY.programme[3]}<`)
    .replace(/>weeks, your pace</g, `>${HOME_SOURCE_COPY.programme[4]}<`)
    .replace(/<img\b[^>]*\bsrc="\/home\/[^"/]+\.jpg"[^>]*>/g, homeResponsiveImage)
    .replace(
      /<div data-screen-label="Missions (\d{2}-\d{2})" data-stackpanel=""/g,
      '<div data-screen-label="Missions $1" data-home-chapter="$1" data-stackpanel=""',
    )
    .replaceAll('<div data-mob="chapter"', '<div data-home-chapter-copy="" data-mob="chapter"')
    .replace(
      /(<div data-home-chapter-copy=""[^>]*>[\s\S]*?)<h2 /g,
      '$1<h2 data-home-chapter-title="" ',
    )
    .replace("<h1 ", '<h1 data-home-hero-title="" ')
    .replace(
      /(<h1 data-home-hero-title=""[^>]*>[\s\S]*?<\/h1>\s*)<p /,
      '$1<p data-home-hero-copy="" ',
    )
    .replace(/(<a href="[^"]*\/program(?:\?entry=start)?" class="scp2")/, '$1 data-home-hero-cta=""')
    .replace('<div style="flex-shrink: 0; background: rgb(16, 15, 15); display: flex;', '<div data-home-hero-meta="" style="flex-shrink: 0; background: rgb(16, 15, 15); display: flex;')
    .replace(
      '<div data-screen-label="Final CTA" data-snap=""',
      '<div data-screen-label="Final CTA" data-home-final-composition=""',
    )
    .replace(/<div data-screen-label="([^"]+)"/g, (tag, label: string) => (
      HOME_SNAP_LABELS.has(label) ? `${tag} data-home-snap="" data-home-snap-label="${label}"` : tag
    ));

  // Phones read the three Programme chapters as compact cards whose own buttons are hidden,
  // so one primary action follows them. It clones the hero action, whose href already
  // carries the locale's Programme path; CSS shows it only at phone widths.
  const heroAction = /<a href="[^"]*" class="scp2" data-home-hero-cta=""[^>]*>[^<]*<\/a>/.exec(transformed)?.[0];
  const withChaptersAction = heroAction
    ? transformed.replace(
      '<div data-screen-label="Built from evidence"',
      `<div data-home-chapters-cta="">${heroAction.replace(' data-home-hero-cta=""', "")}</div><div data-screen-label="Built from evidence"`,
    )
    : transformed;

  const withSnapAnchors = HOME_STICKY_SNAP_LABELS.reduce((output, label) => output.replace(
    `<div data-screen-label="${label}"`,
    `<div aria-hidden="true" data-home-snap="" data-home-snap-anchor="" data-home-snap-label="${label}" style="height:1px;margin-bottom:-1px;pointer-events:none;width:1px;"></div><div data-screen-label="${label}"`,
  ), withChaptersAction);
  return translateHomeHandoff(withSnapAnchors, locale);
}

export function transformHomeHandoffCss(css: string) {
  const withoutCapturedHomeControls = css
    .replace(
      /@media \(pointer: coarse\) \{\s*html \{ scroll-snap-type:y mandatory; \}\s*\[data-snap\] \{ scroll-snap-align:start; \}\s*\}/,
      "",
    )
    .replace(
      /\s*html \{ scrollbar-width:none; \}\s*html::\-webkit-scrollbar, body::\-webkit-scrollbar \{ width:0; height:0; display:none; \}/,
      "",
    );
  return `${withoutCapturedHomeControls}
    [data-home-hero-kicker] {
      max-width: min(760px, calc(100vw - 96px));
      line-height: 1.35 !important;
      text-wrap: balance;
      white-space: normal !important;
    }
    html[lang="de-DE"] [data-handoff-page="home"] [data-hero] h1 {
      max-width: calc(100vw - 48px);
      font-size: clamp(48px, 7.4vw, 112px) !important;
      overflow-wrap: normal;
      text-wrap: balance;
    }
    @media (max-width: 760px) {
      [data-home-hero-kicker] {
        max-width: calc(100vw - 112px);
        font-size: 11px !important;
        letter-spacing: .16em !important;
      }
      html[lang="de-DE"] [data-handoff-page="home"] [data-hero] h1 {
        font-size: clamp(42px, 12.5vw, 54px) !important;
        line-height: .94 !important;
      }
    }
    [data-home-snap] {
      scroll-snap-align: start;
      scroll-snap-stop: normal !important;
    }
    [data-public-shell="footer"],
    [data-public-footer-bottom] {
      scroll-snap-align: end;
      scroll-snap-stop: normal;
    }
    @media (prefers-reduced-motion: no-preference) {
      html { scroll-snap-type: y proximity; }
    }
    @media (prefers-reduced-motion: no-preference) and (pointer: fine) {
      html { scroll-snap-type: y mandatory; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-snap-type: none !important; }
    }
    [data-home-chapters-cta] { display: none; }
    /*
     * Phones (Founder, 24 Sep 2026): the pinned "A plan you can see" theatre and the three
     * full-screen chapter cards that replaced one another cost about five screens and hid
     * the only concrete facts behind a growing photo. Below 760px the chapters become three
     * compact cards in normal flow, the facts stay readable, one primary action follows,
     * and scrolling is free. Desktop keeps the full composition.
     */
    @media (max-width: 760px) {
      html { scroll-snap-type: none !important; }
      [data-handoff-page="home"] [data-screen-label="A plan you can see"] {
        position: relative !important;
        height: auto !important;
        min-height: 0 !important;
        padding: 72px 24px 48px !important;
      }
      [data-handoff-page="home"] [data-screen-label="A plan you can see"] > div:nth-of-type(2) { margin-top: 40px !important; }
      [data-handoff-page="home"] [data-screen-label="A plan you can see"] > div:last-child { display: none !important; }
      [data-handoff-page="home"] [data-stackpanel] {
        position: relative !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 16px 16px !important;
        display: block !important;
        border: 1px solid rgba(250, 250, 247, .12) !important;
        border-radius: 20px !important;
        box-shadow: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
      [data-handoff-page="home"] [data-stackpanel] > div:first-child {
        position: relative !important;
        inset: auto !important;
        aspect-ratio: 16 / 9;
        overflow: hidden;
      }
      [data-handoff-page="home"] [data-stackpanel] > div:first-child img { object-position: 50% 28% !important; }
      [data-handoff-page="home"] [data-stackpanel] > div:nth-child(2),
      [data-handoff-page="home"] [data-stackpanel] [data-stackind],
      [data-handoff-page="home"] [data-stackpanel] [data-mob="chapter"] > a { display: none !important; }
      [data-handoff-page="home"] [data-stackpanel] [data-mob="chapter"] {
        padding: 20px 20px 24px !important;
        text-align: left !important;
        opacity: 1 !important;
      }
      [data-handoff-page="home"] [data-stackpanel] [data-mob="chapter"] > div:first-child { margin-bottom: 12px !important; }
      [data-handoff-page="home"] [data-stackpanel] [data-mob="chapter"] h2 { font-size: 34px !important; }
      [data-handoff-page="home"] [data-stackpanel] [data-mob="chapter"] p { margin-top: 12px !important; font-size: 16px !important; }
      [data-handoff-page="home"] [data-home-chapters-cta] {
        padding: 16px 16px 64px;
        display: flex;
        justify-content: center;
        background: #100F0F;
      }
      /* Founder, 25 Sep 2026: the closing "Start with one situation" block no longer fills a
         whole screen on phones; its content keeps ordinary section spacing to its neighbours. */
      [data-handoff-page="home"] [data-home-final-composition] { min-height: 0 !important; }
      [data-handoff-page="home"] [data-home-final-composition] > div:has(> h2) { padding: 56px 24px 64px !important; }
    }
  `;
}

export function transformTenStepsHandoff(html: string, locale: SupportedLocale = "en-GB", programmePath = "/program") {
  let semanticHtml = transformElementContaining(
    html,
    "Ten steps.<br>",
    (_elementHtml, startTag) => startTag.includes("min-height: 92vh"),
    (elementHtml, startTag) => retagElement(elementHtml, startTag, "section", 'data-ten-steps-section="hero" aria-labelledby="ten-steps-title"')
      .replace("<h1 ", '<h1 id="ten-steps-title" '),
  );
  semanticHtml = transformElementContaining(
    semanticHtml,
    "Three things you'll have at the end.",
    (_elementHtml, startTag) => startTag.includes("position: relative; overflow: hidden; background: rgb(250, 250, 247)"),
    (elementHtml, startTag) => retagElement(elementHtml, startTag, "section", 'data-ten-steps-section="programme-builds" aria-labelledby="ten-steps-builds-title"')
      .replace("<h2 ", '<h2 id="ten-steps-builds-title" '),
  );
  semanticHtml = transformElementContaining(
    semanticHtml,
    ">The path</h2>",
    (elementHtml, startTag) => startTag.includes("background: rgb(244, 241, 235)") && elementHtml.includes("Long-term control"),
    (elementHtml, startTag) => retagElement(elementHtml, startTag, "section", 'data-ten-steps-section="mission-map" aria-labelledby="ten-steps-path-title"')
      .replace("<h2 ", '<h2 id="ten-steps-path-title" ')
      .replace(
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 0px 72px;">',
        '<div role="list" aria-labelledby="ten-steps-path-title" data-ten-steps-mission-list="" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 0px 72px;">',
      )
      .replaceAll(
        '<div style="display: flex; gap: 22px; padding: 22px 0px; border-bottom: 1px solid rgba(16, 15, 15, 0.12);">',
        '<div role="listitem" data-ten-steps-mission="" style="display: flex; gap: 22px; padding: 22px 0px; border-bottom: 1px solid rgba(16, 15, 15, 0.12);">',
      ),
  );
  semanticHtml = transformElementContaining(
    semanticHtml,
    "What you say here,",
    (elementHtml, startTag) => startTag.includes("background: rgb(244, 241, 235)") && elementHtml.includes("No mission ever asks"),
    (elementHtml, startTag) => retagElement(elementHtml, startTag, "section", 'data-ten-steps-section="account-boundary" aria-labelledby="ten-steps-account-title"')
      .replace("<h2 ", '<h2 id="ten-steps-account-title" '),
  );
  semanticHtml = transformElementContaining(
    semanticHtml,
    "Mission 01 takes about<br>",
    (_elementHtml, startTag) => startTag.includes("position: relative; background: rgb(16, 15, 15)"),
    (elementHtml, startTag) => retagElement(elementHtml, startTag, "section", 'data-ten-steps-section="final-action" aria-labelledby="ten-steps-final-title"')
      .replace("<h2 ", '<h2 id="ten-steps-final-title" '),
  );
  const translation = tenStepsTranslation(locale);
  const textTranslations = new Map<string, string>(TEN_STEPS_SOURCE_COPY.map((source, index) => [source, translation.text[index]]));
  const translatedText = semanticHtml.replace(/>([^<>]*)</g, (match, text: string) => {
    const value = text.trim();
    const localized = textTranslations.get(value);
    if (!localized) return match;
    const leading = text.slice(0, text.indexOf(value));
    const trailing = text.slice(text.indexOf(value) + value.length);
    return `>${leading}${escapeHtml(localized)}${trailing}<`;
  });
  const sourceAlt = TEN_STEPS_SOURCE_COPY.at(-1) ?? "";
  const localizedAlt = translation.text.at(-1) ?? sourceAlt;
  const translated = translatedText.replace(`alt="${sourceAlt}"`, `alt="${escapeHtml(localizedAlt)}"`);
  return buttonToLink(translated, translation.text[5], `${programmePath}?entry=start`);
}

export function transformResponsibleGamblingHandoff(html: string) {
  let output = [
    ["Get support", "/help"],
    ["Read the guides", "/learn?category=responsible-gambling"],
    ["Open Help", "/help"],
  ].reduce((output, [label, href]) => buttonToLink(output, label, href), html);
  output = output
    .replace("No tests to pass, no labels, no judgement. Three ways forward — pick the one that fits today.", "Information and self-directed tools, without diagnosis or judgement. Choose support, practical controls or the Programme—at your pace.")
    .replace("Ten private missions: understand your patterns, set boundaries that fit your life, keep a plan you can review.", "Ten self-directed missions to notice patterns, set personal boundaries and keep a plan you can review. This is education, not treatment or a safety guarantee.")
    .replace("A boundary worth stating: B4GAMBLE does not diagnose, does not calculate a \"safe\" gambling amount, and does not determine what you can afford. Those judgements stay yours — our job is to give you the tools and the quiet to make them.", "B4GAMBLE does not diagnose, provide treatment, calculate a ‘safe’ gambling amount or decide what you can afford. Gambling involves financial risk. If you are worried about harm, independent support and self-exclusion may be more appropriate than continuing the Programme.")
    .replace("B4GAMBLE uses public NHS and NICE guidance to shape recognition language and Programme risk boundaries. The complete Programme has not yet been clinically evaluated.", "Public NHS and NICE guidance informs recognition language and Programme boundaries. The complete Programme has not been clinically evaluated and is not medical care, treatment or crisis support.");
  return output;
}

export function transformHelpHandoff(html: string) {
  let output = html.replace(
    /<div([^>]*)>Independent support — free, confidential, not affiliated with us<\/div>/,
    '<div id="independent-support"$1>Independent support — free, confidential, not affiliated with us</div>',
  );
  output = [
    ["Pause now", "#independent-support"],
    ["See the steps", "#independent-support"],
    ["Set up blocks", "/learn?category=responsible-gambling"],
    ["Write to us", "/contact"],
  ].reduce((result, [label, href]) => buttonToLink(result, label, href), output);
  output = output
    .replace("Independent support — free, confidential, not affiliated with us", "External support and controls — review each provider’s service and privacy terms")
    .replace("This space has no offers, no tracking for ads, and nothing to sell. Take what you need.", "No casino, bonus or affiliate actions appear here. Help activity is not used for offers, rankings or commercial personalisation. Take what you need.")
    .replace("Gamblers Anonymous", "GAMSTOP")
    .replace("Local meetings", "Online self-exclusion")
    .replace("BeGambleAware", "NHS gambling support")
    .replace("begambleaware.org", "NHS.uk")
    .replace("Gambling Therapy", "GamCare live support")
    .replace("Online, worldwide", "Free · 24/7")
    .replace("If you're in immediate danger or crisis, contact your local emergency services now. This page is support, not emergency care.", "If someone’s life is at risk, or you cannot keep yourself or someone else safe, call 999 or go to A&amp;E now. For urgent mental-health help, use NHS 111 online or call 111 and select the mental-health option. B4GAMBLE is not an emergency or clinical service.")
    .replace("Your activity here is never used for offers, rankings or ads.", "Help activity is not used for offers, rankings, advertising or commercial personalisation. Ordinary security and bounded page analytics may still apply as described in Privacy.")
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
  const urgentMarker = '<p style="font-size: 14px; line-height: 1.6; color: rgba(250, 250, 247, 0.65); margin: 32px 0px 0px; max-width: 66ch;">';
  const urgentIndex = output.indexOf(urgentMarker);
  if (urgentIndex >= 0) {
    const links = `<div role="navigation" aria-label="Official independent support" style="display:flex;gap:12px 24px;flex-wrap:wrap;margin-top:28px;font-size:14px;"><a href="https://www.gamstop.co.uk/" rel="noopener noreferrer" target="_blank" style="color:rgb(250,250,247);">GAMSTOP self-exclusion ↗</a><a href="https://www.nhs.uk/live-well/addiction-support/gambling-addiction/" rel="noopener noreferrer" target="_blank" style="color:rgb(250,250,247);">NHS gambling support ↗</a><a href="https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/" rel="noopener noreferrer" target="_blank" style="color:rgb(250,250,247);">NHS urgent mental-health help ↗</a></div>`;
    output = output.slice(0, urgentIndex) + links + output.slice(urgentIndex);
  }
  return output;
}

export function transformNotFoundHandoff(html: string, messages: PublicErrorMessages, hrefFor: (href: string) => string = (href) => href) {
  return html.replace(
    /<div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: clamp\(120px, 18vw, 240px\); line-height: 0\.9; letter-spacing: -0\.02em;">404<\/div>/,
    '<h1 style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: clamp(120px, 18vw, 240px); line-height: 0.9; letter-spacing: -0.02em; margin: 0px;">404</h1>',
  )
    .replaceAll("This route is lost.", escapeHtml(messages.notFoundLost))
    .replaceAll("Let&#x27;s get you back on course.", escapeHtml(messages.notFoundBack))
    .replaceAll("Let's get you back on course.", escapeHtml(messages.notFoundBack))
    .replaceAll("Go to homepage", escapeHtml(messages.notFoundHome))
    .replaceAll("About the Programme →", escapeHtml(messages.notFoundAbout))
    .replace('href="/"', `href="${escapeHtml(hrefFor("/"))}"`)
    .replace('href="/10-steps"', `href="${escapeHtml(hrefFor("/10-steps"))}"`);
}
