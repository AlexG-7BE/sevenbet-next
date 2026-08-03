---
Title: RFC-005 — Prismatic Product Theatre Design Direction
Status: Superseded by RFC-006
Classification: Internal
Owner: Founder / Product / Design
Date: 2026-08-03
Decision: Replace the previous SevenBet creative direction with Prismatic Product Theatre and rebuild future design-system and product work around a product-visible, spatial decision-system identity.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ../01_Product_Master_Plan/Product-Master-Plan.md
  - ./RFC-002-Active-Control-Program-and-Dashboard.md
  - ./RFC-003-Program-Led-Commercial-Growth.md
  - ./RFC-004-Commercial-Launch-Delivery-Plan.md
---

# RFC-005 — Prismatic Product Theatre Design Direction

> Superseded on 2026-08-03 by [RFC-006 — Human Guidance Trust-Led Design Direction](./RFC-006-Human-Guidance-Trust-Led-Design-Direction.md). This document remains the historical record of the Prismatic decision and its constraints.

## Decision summary

SevenBet SHALL adopt **Prismatic Product Theatre** as its new product and brand design direction.

The direction presents SevenBet as a connected decision system rather than a conventional casino affiliate site or a passive responsible-gambling information service. Its central visual object is the **Control Core**: an original spatial product visual that connects the 10-Step Control Program, comparison evidence, commercial discovery and personal progress.

The previously approved **Calm Editorial Intelligence** direction, the **Midnight Field** Home direction and Manrope-led visual language are superseded as future design authority. Existing Figma foundations and screens remain historical design artefacts until the replacement foundations and Home are validated; they SHALL not be silently reused as the source of the new visual system.

This RFC changes visual and interaction direction only. It does not change the Product Vision, the Program registration sequence, commercial boundaries, protected Help experience, market eligibility rules or reward restrictions defined by the governing documents.

## 1. Product expression

The new design must make three parts of SevenBet legible as one product:

1. **Control engine:** the user performs missions, creates rules and maintains a personal plan.
2. **Comparison layer:** licensing, conditions, payment evidence and product quality are aligned for evaluation.
3. **Commercial discovery:** eligible casinos, bonuses and best offers remain persistent, explicit routes.

The 10-Step Program is the primary acquisition story and the primary Home CTA. Commercial discovery remains visible in global navigation and receives a clear secondary Home CTA. Neither route is visually hidden or presented as an accidental addition.

Approved Home proposition:

> Control the moment. Compare the choice.

Approved primary action:

> Start Step 01

Approved secondary action:

> Explore Best offers

Final market-facing copy remains subject to content and UK compliance review.

## 2. Visual thesis

Prismatic Product Theatre combines:

- a near-black spatial canvas;
- a luminous, refractive Control Core;
- restrained technical typography;
- visible product-state cards rather than abstract promotional decoration;
- selective depth, glass and spectral light;
- large, quiet compositions with short copy;
- strong neutral CTAs and role-specific chromatic accents.

The interface should feel advanced, exact and memorable. It must not resemble a generic crypto landing page, AI wrapper, neon casino, gaming lobby or dashboard template.

The “wow” moment comes from the relationship between the Control Core and real SevenBet product states: `Mission 01`, `Offer scanner`, `Comparison evidence`, XP and streak progress. A decorative 3D object without those product relationships does not satisfy this direction.

## 3. Reference lock

### 3.1 Primary reference role

**Active Theory** is the primary reference for spatial composition, immersive darkness, refractive media and sparse technical interface treatment.

Traits to preserve:

- void-like black canvas;
- one central spatial visual with controlled luminescence;
- compact technical labels;
- selective rather than pervasive colour;
- restrained UI floating around the central media object;
- depth created by light, translucency and motion rather than heavy shadows.

### 3.2 Supporting reference role

**Spline AI product marketing** is a supporting reference for connecting 3D media to understandable product functions and product screenshots.

Details that may be adapted:

- product capabilities represented as visible tools rather than prose;
- alternating spatial product scenes and concise explanatory blocks;
- a product map that makes the system understandable before detailed reading.

### 3.3 Explicit rejects

The design SHALL reject:

- slot-machine, roulette, chip, card-suit and jackpot motifs;
- generic people or lifestyle photography in the hero;
- purple gradients used indiscriminately across every surface;
- glassmorphism on ordinary content and compliance information;
- floating shapes without a defined product meaning;
- decorative word styling that does not communicate hierarchy;
- excessive marketing copy above the fold;
- urgency, countdowns, fake activity and scarcity;
- 3D or motion that delays access to Program, Help, eligibility or material offer terms.

## 4. Foundation commitments

### 4.1 Colour roles

The initial palette is approved as a direction and SHALL be converted into semantic tokens before component work:

| Token role | Initial value | Intended use |
| --- | --- | --- |
| `surface/void` | `#030406` | Primary spatial page canvas. |
| `surface/panel` | `#0D1016` | Product panels and cards. |
| `text/primary` | `#F6F7FB` | Primary text and neutral high-emphasis controls. |
| `text/secondary` | `#AEB5C2` | Secondary explanation and metadata. |
| `spectral/violet` | `#9BA8FF` | Control Core light and selected Program state. |
| `spectral/cyan` | `#76F2E6` | Verification, evidence and active system signals. |
| `spectral/pink` | `#ED84FF` | Rare refractive highlight; not a general CTA colour. |

Chromatic values are light roles, not generic component backgrounds. The default primary CTA is a high-contrast neutral control, not a neon gradient button.

Help and safety states require their own accessible semantic roles. They must not depend on spectral decoration and must retain the protected commercial-free experience.

### 4.2 Typography

The approved initial type direction is:

- **Space Grotesk** for display, navigation and product UI;
- **IBM Plex Mono** for compact labels, evidence metadata, mission identifiers and verification states.

Typography must remain short, functional and highly legible. Large display copy carries the proposition; body copy explains only what is necessary for the next decision.

### 4.3 Geometry and surfaces

- 7px radius for compact controls;
- 10–14px radius for product-state panels;
- thin neutral or translucent borders;
- glass and blur only for spatial product overlays;
- opaque, high-contrast surfaces for material terms, comparison data, forms and Help;
- restrained elevation; depth is primarily spatial and luminous.

The exact scale must be tokenised and validated for responsive implementation before becoming a production foundation.

## 5. Home information and conversion architecture

The new Home SHALL be composed in this order:

1. **Global navigation** — `Casinos`, `Bonuses`, `Best offers`, `Reviews`, `10-Step Program`, account entry and Help access.
2. **Hero / Control Core** — short proposition, `Start Step 01`, `Explore Best offers`, and visible Program/comparison states around the Control Core.
3. **Connected product systems** — Control engine, Offer scanner and Comparison layer.
4. **10-Step Program map** — ten missions represented as a meaningful progression with the first mission available before registration.
5. **Commercial discovery** — ranked eligible offers with material conditions, evidence and disclosure visible before referral activation.
6. **Trust and regulation** — UK eligibility, 18+, affiliate disclosure, methodology and protected Help route.
7. **Footer** — commercial, editorial, Program, Help, legal and account routes.

The Hero must contain no more than one proposition, one supporting sentence and two primary decision routes. Product proof must do more explanatory work than body copy.

## 6. Media and motion system

### 6.1 Control Core

The Control Core SHALL be an original SevenBet asset. It may be implemented as WebGL, a shader-based composition, a rendered 3D sequence or a performant hybrid, subject to technical validation.

It represents a decision system, not gambling excitement. Its connected states must include real product meaning, such as:

- Mission progress;
- a saved personal rule;
- verified offer count;
- material-condition flag;
- comparison evidence;
- XP or streak earned for Program actions only.

### 6.2 Motion rules

Motion may provide depth, continuity and state change. It must not create urgency or reward commercial activation.

Required behaviour:

- reduced-motion equivalent;
- static fallback for low-power devices and unsupported browsers;
- no essential information available only through animation;
- no looping celebration around casino, bonus or referral actions;
- Program reward animation remains separated from commercial CTA;
- interaction feedback must remain clear without the 3D layer.

Performance budgets and implementation technology require a separate engineering decision before production delivery.

## 7. Responsive behaviour

Desktop uses the full spatial composition. Mobile SHALL preserve the same hierarchy without attempting to compress the desktop scene literally.

On mobile:

- the proposition and `Start Step 01` remain visible before the Control Core;
- the Control Core may become a static or simplified rendered asset;
- floating product states collapse into an ordered product proof stack;
- global commercial routes remain accessible through navigation;
- material offer terms remain opaque, readable and non-overlapping;
- Help remains accessible and commercially protected.

## 8. Accessibility, compliance and truth

The visual system SHALL:

- meet applicable WCAG contrast requirements for text and controls;
- maintain keyboard and screen-reader access independent of spatial media;
- label affiliate and sponsored states in readable text;
- expose material offer conditions before referral activation;
- present only eligible, locally licensed operators in the UK market;
- keep protected Help free from casino, bonus, best-offer and affiliate CTA;
- avoid language or motion that implies safety, profit, winning or urgency;
- preserve a clear option to pause, leave, use Help or choose not to play.

The Prismatic direction does not authorise reduced disclosure, hidden terms or promotional pressure in exchange for visual simplicity.

## 9. Figma migration and delivery order

Implementation SHALL proceed in small validated stages:

1. mark the previous direction as superseded and isolate legacy artefacts;
2. create the new Prismatic semantic token proposal without duplicating unresolved production tokens;
3. validate typography, contrast, responsive behaviour and Control Core media strategy;
4. build the minimum reusable component set required by Home;
5. assemble Home section by section and validate each section visually;
6. validate desktop Home as one continuous composition;
7. create the mobile interpretation;
8. move only validated components and screens to Ready for Dev;
9. deprecate or archive superseded design artefacts only after the replacement is accepted.

Existing Figma foundations SHALL not be silently recoloured or repurposed. The new system must use explicit new semantic roles so engineering and design can distinguish legacy and approved direction during migration.

## 10. Consequences

This decision increases SevenBet's visual distinctiveness and makes the product layer visible before long explanation. It also adds real production cost: original media, motion design, responsive fallbacks, performance work and stronger QA are required.

The direction is successful only if users can still understand the next action, the Program's practical value, the commercial routes and the material conditions without depending on spectacle. Visual sophistication is a means of making SevenBet credible and memorable; it is not a substitute for product utility or evidence.
