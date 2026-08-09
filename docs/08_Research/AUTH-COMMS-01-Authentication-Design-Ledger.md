# AUTH-COMMS-01 Authentication Design Ledger

- **Status:** Applied to the implementation
- **Date:** 2026-08-09
- **Scope:** Google option inside the existing Programme registration/sign-in surface

## Product brief

The screen is for adults who want to save or return to private Programme progress. Google should reduce authentication effort without becoming the dominant product story, implying age verification or bundling communications consent. The surface must retain SevenBet's existing local-first disclosure, email/password option, 18+ boundary and split editorial composition.

## Research set

Refero research covered three visual systems, five sign-up/sign-in screens and two end-to-end authentication flows.

### Style references

| Reference | Useful signal | Applied decision |
| --- | --- | --- |
| N26 — `59911817-9d14-445a-9f1b-617418001061` | Institutional white/ink/deep-teal clarity, flat borders, restrained elevation | Neutral Google control, high-contrast focus and no decorative social-login card |
| Public — `b501d608-f10c-490c-8e88-a48a557603db` | Crisp editorial finance hierarchy and compact hairline separation | Small explicit divider and secondary policy copy |
| Zara — `4fd4d6f2-65ec-4174-ac2d-37e3100d0985` | Precise form/editorial-image split | Preserve the existing SevenBet form plus PhotoTheatre layout |

### Screen references

| Reference | Pattern retained |
| --- | --- |
| Make login — `53061803-f48a-4c0a-b943-a9aeeebda9dd` | Preserve a useful form/editorial split and visible error state |
| Wix sign-up — `8d591582-571f-49d1-8569-d89411d43222` | Keep account mode, fields and legal requirements legible in one surface |
| ElevenLabs sign-up — `61a75f68-fbc9-44b9-9ca7-35c7fb9f2c73` | Google as a low-effort account method without hiding email |
| ElevenLabs sign-up — `693d5970-94e3-4d05-b749-3c1f1602799d` | Consent control remains separate from the social button |
| ElevenLabs sign-up — `cae94664-1c2b-4071-a136-ad364fa835a9` | Full-width social action with a restrained neutral treatment |

### Flow references

| Reference | Journey decision |
| --- | --- |
| Typeform sign-in workspace — flow `5578` | Authentication returns to a clear owned destination rather than a generic confirmation page |
| Around authentication — flow `1990` | Cancellation/error is recoverable and bounded; recovery does not reveal account internals |

## Reference lock

- **Primary authority:** existing SevenBet Active Control Programme registration, typography, palette, controls and PhotoTheatre.
- **Visual support:** N26's restrained institutional clarity.
- **Interaction support:** ElevenLabs social-first ordering with explicit email fallback.
- **Error support:** Make/Wix visible, text-based failure treatment.

The implementation preserves cream/ink/teal, Archivo/Instrument Serif, current page width, form/photo split, existing primary button and high-contrast teal focus. The Google control is neutral white with the official multicolour mark. Semantic red remains error-only. No new global component family or design token is introduced.

## Decisions and rejected alternatives

| Decision | Why | Rejected |
| --- | --- | --- |
| One full-width `Continue with Google` control | Familiar, accessible and compatible with sign-in/sign-up intent | One Tap SDK, icon-only control, provider-branded hero |
| Google before email fields with a literal divider | Lowers effort while preserving password access | Hidden email fallback, tabs, provider carousel |
| 18+ and Terms remain separate controls | Prevents identity consent from becoming age, legal or reminder consent | Pre-checked/bundled consent and consent inside provider copy |
| Small plain-language Google boundary note | Corrects likely assumptions without visual alarm | Trust badge, security certification, deliverability claim |
| Existing PhotoTheatre and local-result card remain | Keeps Programme context and privacy promise visible | Standalone authentication product, generic centred modal, new stock asset |
| Google absent when server credentials are incomplete | Prevents broken affordance and configuration leakage | Disabled button naming the missing secret |
| Text error plus `role=alert` | Understandable without colour | Toast-only or raw provider error |

## Quality gates

- Desktop and mobile keep the form before the editorial image in reading order.
- Keyboard focus is visible on Google, email, checkboxes, submit and mode switch.
- Busy state disables repeat initiation.
- Reduced-motion mode removes new control transitions.
- Google is not described as age verification, protection of gambling data, email permission or inbox delivery authority.
- The page sends no Programme narrative to Google and loads no Google client SDK.
