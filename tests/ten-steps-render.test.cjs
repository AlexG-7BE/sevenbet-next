const assert = require("node:assert/strict");
const test = require("node:test");

const generatedPages = require("../lib/final-handoff/generated-pages.json");
const {
  transformCommonHandoff,
  transformTenStepsHandoff,
} = require("../lib/final-handoff/transforms.ts");
const {
  TEN_STEPS_SOURCE_COPY,
  tenStepsTranslation,
} = require("../lib/i18n/static-pages/ten-steps.ts");
const { programmeMissionTitles } = require("../lib/programme/program-ai/mission-registry.ts");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderActiveTenSteps(locale = "en-GB") {
  const source = transformCommonHandoff(generatedPages.tenSteps.html);
  return {
    html: transformTenStepsHandoff(source, locale),
    messages: tenStepsTranslation(locale),
  };
}

test("active 10 Steps Handoff runtime exposes one ordered, labelled Mission sequence", () => {
  const { html, messages } = renderActiveTenSteps();
  const sections = [...html.matchAll(/data-ten-steps-section="([^"]+)"/g)].map((match) => match[1]);
  const missionTitles = Array.from({ length: 10 }, (_, index) => messages.text[20 + index * 2]);

  assert.deepEqual(sections, ["hero", "programme-builds", "mission-map", "account-boundary", "final-action"]);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((html.match(/id="ten-steps-path-title"/g) ?? []).length, 1);
  assert.equal((html.match(/role="list" aria-labelledby="ten-steps-path-title" data-ten-steps-mission-list/g) ?? []).length, 1);
  assert.equal((html.match(/role="listitem" data-ten-steps-mission/g) ?? []).length, 10);
  assert.deepEqual(missionTitles, programmeMissionTitles);

  let cursor = html.indexOf('data-ten-steps-mission-list=""');
  const missionSectionEnd = html.indexOf('data-ten-steps-section="account-boundary"', cursor);
  assert.ok(cursor >= 0 && missionSectionEnd > cursor);
  for (const [index, title] of missionTitles.entries()) {
    const numberIndex = html.indexOf(`>${String(index + 1).padStart(2, "0")}</span>`, cursor);
    const titleIndex = html.indexOf(`>${escapeHtml(title)}</div>`, numberIndex);
    assert.ok(numberIndex >= cursor, `Mission ${index + 1} number follows the previous Mission`);
    assert.ok(titleIndex > numberIndex && titleIndex < missionSectionEnd, `Mission ${index + 1} exposes ${title}`);
    cursor = titleIndex;
  }
});

test("active 10 Steps copy states current timing and the Mission 01 reward boundary", () => {
  const { html, messages } = renderActiveTenSteps();
  const closing = `${messages.text[46]} ${messages.text[47]}`;
  const actionIndex = messages.text[48].indexOf("two actions");
  const rewardIndex = messages.text[48].indexOf("40 XP");
  const registrationIndex = messages.text[48].indexOf("Registration awards no XP");

  assert.equal(messages.text.length, 50);
  assert.match(messages.text[4], /5–8 minutes/);
  assert.doesNotMatch(messages.text[4], /5–15/);
  assert.equal(closing, "Mission 01 starts with your Starting Point.");
  assert.doesNotMatch(closing, /minute/i);
  assert.ok(actionIndex >= 0 && actionIndex < rewardIndex);
  assert.ok(rewardIndex < registrationIndex);
  assert.match(messages.text[48], /only follows when it is ready/);

  assert.ok(html.includes(`>${escapeHtml(messages.text[4])}<`));
  assert.ok(html.includes(`>${escapeHtml(messages.text[46])}<br>`));
  assert.ok(html.includes(`>${escapeHtml(messages.text[47])}</em>`));
  assert.ok(html.includes(`>${escapeHtml(messages.text[48])}<`));
  assert.match(html, /href="\/program\?entry=start"/);
  assert.doesNotMatch(html, />Each mission takes 5–15 minutes/);
  assert.doesNotMatch(html, />Mission 01 takes about/);
  assert.doesNotMatch(html, />one minute\.</);
});

test("generated Handoff source keys remain separate from current public copy", () => {
  const messages = tenStepsTranslation("en-GB");

  assert.equal(TEN_STEPS_SOURCE_COPY.length, 50);
  assert.match(TEN_STEPS_SOURCE_COPY[4], /5–15 minutes/);
  assert.equal(TEN_STEPS_SOURCE_COPY[46], "Mission 01 takes about");
  assert.equal(TEN_STEPS_SOURCE_COPY[47], "one minute.");
  assert.notEqual(messages.text[4], TEN_STEPS_SOURCE_COPY[4]);
  assert.notEqual(messages.text[46], TEN_STEPS_SOURCE_COPY[46]);
  assert.notEqual(messages.text[47], TEN_STEPS_SOURCE_COPY[47]);
});
