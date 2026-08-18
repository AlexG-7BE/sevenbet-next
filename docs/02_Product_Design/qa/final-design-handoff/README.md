# Final Design Handoff Visual QA

## Evidence set

- **Detected:** 88 disposable full-page PNGs cover 22 ordinary-runtime public surfaces at 1440, 1024, 430 and 390 CSS pixels; these redundant raw files are intentionally not committed.
- **Detected:** the matrix was regenerated from the final production build on 17 August 2026.
- **Detected:** every captured route returned its expected status, produced no unexpected browser-console or page errors, and had no document-level horizontal overflow.
- **Detected:** [`true-parity/`](true-parity/README.md) is the final acceptance evidence: direct reference, implementation and amplified-diff WebPs for 24 surfaces at all four widths, plus bounded side-by-side files and machine-readable metrics.
- **Detected:** commercial parity uses the exact handoff samples through a local-only visual fixture; the ordinary Preview remains connected to governed current data. Programme captures expose intake, Starting Point/account claim and Dashboard states with controlled network DTOs.

The canonical committed evidence is `true-parity/`. Earlier evidence folders remain historical Draft-PR material and are superseded for visual acceptance.

## Final verification

| Gate | Result |
| --- | --- |
| `npm run ci:quality` | Passed: lint, type checking, Prisma validation and all structural/domain/security suites |
| `npm run build` | Passed |
| `npm run programme:test` | Passed: 119/119 |
| Core browser suite | Passed: 60 tests; one intentionally skipped Google-provider test |
| Programme browser suite | Passed: 11/11 |
| Final visual matrix | Passed: 1 matrix test, 88 screenshots, no overflow or browser errors |

## Manual visual review

Representative desktop and small-screen reference/implementation/diff captures were inspected for hero composition, responsive navigation, editorial hierarchy, populated commercial surfaces, Programme access/account-claim/Dashboard states, legal close and contextual modal/sheet. Login, FAQ and Contact were rebuilt after that inspection; FAQ width and Contact column order were corrected before the matrix was frozen.

## Known limits

- The screenshots verify Chromium at four representative viewport widths; physical-device, Safari and assistive-technology review remains a release activity.
- External OAuth, email delivery, affiliate destinations and provider dashboards are intentionally not exercised by this local visual run.
- Dynamic content on a populated Preview can differ from the empty-state screenshots because CMS, jurisdiction and public DTO values remain authoritative.
- Local `next build` reports the repository's existing direct-Prisma-endpoint warning. A deployed Preview must pass its separate pooled-runtime configuration guard.
- This evidence authorises a Draft PR and Preview only. It is not a Production approval or deployment record.
