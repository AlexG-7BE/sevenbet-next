# Founder visual acceptance set

This bounded set places the final handoff reference beside the current implementation for rapid Founder review. Each surface has a 1440 px desktop capture and a 390 px mobile capture. The composite labels are part of the image; the files are WebP-compressed and intentionally crop long pages to the comparison-critical opening area instead of duplicating the existing 88-image full-page matrix.

Surfaces: Home, Mission 01 intake, Mission 01 Starting Point/account claim, Programme Dashboard, Best Offers, Casinos, Casino Review, Bonuses, Bonus Guide, Learn and Protected Help.

Programme screenshots use controlled public API responses to expose states that follow the required access gate. The current UI and server-owned DTO shape are real; fixture values are labelled test evidence and are not public inventory or Production data. Other current screenshots use the running Draft build and its fail-closed local data state. `Casino Review` uses the existing disclosed disposable `demo-northstar` visual-QA fixture when available.

Regenerate against a local Draft build with:

```sh
B4GAMBLE_HANDOFF_DIR=/absolute/path/to/design_handoff_b4gamble \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 \
node scripts/generate-founder-acceptance.mjs
```

These assets are review evidence, not a declaration of Founder acceptance or a Production release approval.
