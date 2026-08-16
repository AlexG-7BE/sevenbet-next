# Final Design Handoff Visual QA

## Evidence set

- **Detected:** 88 full-page PNGs cover 22 public surfaces at 1440, 1024, 430 and 390 CSS pixels.
- **Detected:** the matrix was regenerated from the final production build on 16 August 2026.
- **Detected:** every captured route returned its expected status, produced no unexpected browser-console or page errors, and had no document-level horizontal overflow.
- **Detected:** the base matrix uses the real current disposable-CI application state. Its casino inventory is empty, so commercial directories and the contextual comparison visibly fail closed instead of substituting illustrative claims.
- **Detected:** functional comparison QA used the repository's explicitly labelled fictional demo records in a guarded local `_ci` database. The harness removed all 25 casino fixtures and five redirect fixtures after the run.
- **Detected:** `founder-acceptance/` contains 22 WebP-compressed, labelled side-by-side comparisons for the 11 requested surfaces at 1440 and 390 CSS pixels. The Programme comparisons expose intake, Starting Point/account claim and Dashboard states with controlled test DTOs; the files are review evidence, not a declaration of Founder acceptance.

The canonical evidence folders are `1440/`, `1024/`, `430/` and `390/`. Each contains the same 22 named surfaces, including `home.png`, `casinos.png`, `programme.png`, `article.png` and `contextual-comparison.png`. The supplied handoff archive is the direct visual reference; the bounded side-by-side set avoids duplicating another full matrix.

## Final verification

| Gate | Result |
| --- | --- |
| `npm run ci:quality` | Passed: lint, type checking, Prisma validation and all structural/domain/security suites |
| `npm run build` | Passed |
| `npm run programme:test` | Passed: 119/119 |
| Core browser suite | Passed: 60 tests; one intentionally skipped Google-provider test |
| Programme browser suite | Passed: 11/11 |
| Extended browser base suite | Passed: 61/61 |
| Guarded contextual-comparison suite | Passed: 5/5 |
| Final visual matrix | Passed: 1 matrix test, 88 screenshots, no overflow or browser errors |

## Manual visual review

Representative desktop and small-screen captures were inspected for the hero composition, responsive navigation, editorial hierarchy, casino empty state, Programme access state, legal close and contextual modal/sheet. The final review confirmed the reference-locked near-black/paper/acid-yellow system, Archivo and Instrument Serif hierarchy, usable small-screen reflow and an explicit resolved-empty comparison state. Review also found and closed two defects before the matrix was frozen: compact desktop casino filters now retain accessible labels, and legal footer metadata no longer collapses on mobile.

## Known limits

- The screenshots verify Chromium at four representative viewport widths; physical-device, Safari and assistive-technology review remains a release activity.
- External OAuth, email delivery, affiliate destinations and provider dashboards are intentionally not exercised by this local visual run.
- Dynamic content on a populated Preview can differ from the empty-state screenshots because CMS, jurisdiction and public DTO values remain authoritative.
- Local `next build` reports the repository's existing direct-Prisma-endpoint warning. A deployed Preview must pass its separate pooled-runtime configuration guard.
- This evidence authorises a Draft PR and Preview only. It is not a Production approval or deployment record.
