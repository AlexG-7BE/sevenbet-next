const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

global.React = React;

require.extensions[".css"] = (module) => {
  module.exports = {
    __esModule: true,
    default: new Proxy({}, { get: (_target, property) => String(property) }),
  };
};

const { TenStepsLanding } = require("../app/(public)/10-steps/TenStepsLanding.tsx");

function renderState(state) {
  const html = renderToStaticMarkup(React.createElement(TenStepsLanding, { state }));
  const hero = html.match(/<section[^>]*data-ten-steps-section="hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, "the rendered page must include its hero section");
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  return { hero, html };
}

test("signed-in fallback renders a neutral account state without Programme claims", () => {
  const { hero } = renderState({ kind: "signed-in-fallback" });

  assert.match(hero, /YOUR ACCOUNT/);
  assert.match(hero, /Programme status is unavailable here\./);
  assert.match(hero, /Open the Programme to start or retry\./);
  assert.match(hero, /href="\/program"/);
  assert.doesNotMatch(hero, /already started|saved progress|next Mission|\d+ XP|\d+ of 10 complete|Mission \d+|Continue Mission/i);
});

test("confirmed returning renders only the supplied server-owned values", () => {
  const { hero } = renderState({ kind: "returning", currentMission: 3, completedMissions: 2, totalXp: 145 });

  assert.match(hero, /Mission 03/);
  assert.match(hero, /2 of 10 complete/);
  assert.match(hero, /145 XP/);
  assert.match(hero, /href="\/program"/);
  assert.doesNotMatch(hero, /330 XP|4 of 10 complete/);
});

test("available Programme complete renders only supplied final totals", () => {
  const { hero } = renderState({ kind: "available-programme-complete", completedMissions: 10, totalXp: 715 });

  assert.match(hero, /10 of 10 complete/);
  assert.match(hero, /715 XP/);
  assert.match(hero, /href="\/program"/);
  assert.doesNotMatch(hero, /Mission 11|available now/i);
});

test("anonymous hero preserves Mission 01 entry and pending reward boundary", () => {
  const { hero } = renderState({ kind: "anonymous" });

  assert.match(hero, /Start Programme/);
  assert.match(hero, /\+40 XP/);
  assert.match(hero, /20 XP for describing the situation and 20 XP for confirming the Starting Point\./);
  assert.match(hero, /Registration adds 0 XP\./);
  assert.match(hero, /href="\/program\?entry=start"/);
  assert.doesNotMatch(hero, /WELCOME BACK|MY PROGRAMME|of 10 complete/);
});
