# Final Design Layout Geometry

## Status and authority

**Detected:** this contract is implemented by the final public-site surfaces on `codex/final-design-handoff-v1`. It derives from the final handoff's `clamp(24px, 5vw, 72px)` gutters and 1440/1312px composition boards. It does not alter Programme, commercial, jurisdiction, privacy or data authority.

## Shared primitives

The public site owns one horizontal geometry contract in `app/design-system.css`:

| Primitive | Value | Use |
| --- | --- | --- |
| `--site-gutter` | `clamp(24px, 5vw, 72px)` | The left and right page gutter |
| `--site-content-max` | `1312px` | Normal navigation, footer, commercial cards and page content |
| `--site-wide-max` | `1440px` | Explicitly wide editorial or photographic compositions |
| `--site-reading-max` | `760px` | Long-form reading columns |
| `--site-content-width` | content max constrained by two site gutters | A centred content shell when the parent is full width |

At the required review widths, the gutter resolves to:

| Viewport | Gutter | Normal available line |
| ---: | ---: | ---: |
| 1440px | 72px | 1296px |
| 1024px | 51.2px | 921.6px |
| 430px | 24px | 382px |
| 390px | 24px | 342px |

The 1312px cap becomes active above a 1456px viewport. This is intentional: at the 1440px reference viewport, the handoff gutter remains the governing edge.

## Alignment rules

- Global navigation, the normal page shell, commercial Top-3 surfaces and the footer use `--site-content-width` or an equivalent child inside `--site-gutter` parent padding.
- A component must not introduce a new global shell width. Smaller widths are allowed only for an explicitly named editorial, form or dialog role.
- Nested cards and grids fill their parent shell. They do not subtract a second page gutter.
- Safe-area insets are added to the site gutter for mobile fixed or edge-aligned chrome.

## Intentional full-bleed surfaces

Section backgrounds, hero photography, paint strips, chapter media, sticky photographic stacks, the Programme canvas and the final CTA may extend to the viewport edge. Their content remains aligned to a shared shell unless the handoff deliberately centres the composition.

Comparison dialogs, mobile bottom sheets, filter sheets and outbound confirmation dialogs are viewport overlays. Their dimensions are bounded by the viewport and are not page-shell widths.

## Intentional narrow content

- Long-form prose uses `--site-reading-max` or the article template's 720px reading column.
- FAQ bodies use a 900px editorial measure.
- Dynamic article layouts use a 1120px rail containing navigation plus a 720px reading column.
- Legal documents use their established readable measure rather than stretching to the commercial grid.
- Authentication and focused form panels use their designed task width.

These are content roles, not alternative site shells. Their surrounding hero, navigation and footer anchors still follow the shared site grid.

## Responsive rule

The same token formula applies at desktop, tablet and mobile. Media queries may change layout, ordering and full-bleed behaviour, but must not replace the global gutter with unrelated `32px`, `40px`, `48px`, `64px`, `96px` or `128px` shell subtraction rules.

