# Product Analytics Operations

## Authority and current state

This runbook implements [RFC-026](../06_RFC/RFC-026-MVP-Analytics-and-Programme-Runtime-Hardening.md). Analytics is aggregate measurement only. It is never Programme, reward, access, safety, editorial, ranking, affiliate or commercial authority.

Control-plane evidence was refreshed on 2026-08-11 without sending synthetic events:

| Control | State | Evidence classification |
| --- | --- | --- |
| Vercel project | `sevenbet-next`, project `prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`, team `team_WhkUGuXZeIMlU1uFHtowNUqa` | **Detected** |
| Vercel team plan | Hobby | **Detected** |
| Web Analytics before this workstream | Off | **Detected** |
| Web Analytics after bounded provider action | Enabled; no event data generated | **Detected** |
| Hobby page-view allowance | 50,000 events/month, 30-day retention, no overage billing | **Detected** from the current provider control plane |
| Custom Events | Unavailable on the current Hobby plan | **Detected** |
| Target Custom Events plan | Founder-managed Vercel Pro; maximum two properties per event | **Planned** |
| Web Analytics Plus | Not required and not approved | **Not detected** |
| Repository flag | Exact `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true` required; default off | **Detected** in code |
| Preview/Production flag | Absent | **Detected** in redacted Vercel inventories |
| Custom-event activation | Blocked by plan and absent flag | **Not detected** |
| Incremental recurring commitment | USD 0 | **Detected** for the action taken |

The provider enablement used the existing free Hobby Web Analytics entitlement only. No plan upgrade, payment method, recurring service or deployment was created.

**FOUNDER ACTION REQUIRED — WEB ANALYTICS PLAN:** custom events require a Vercel Pro plan under the provider state detected on 2026-08-11. Base Pro supports at most two custom properties per event; the repository globally enforces that ceiling across all 15 events. Web Analytics Plus is not required or approved. Founder Office must separately approve or reject the Pro plan change. Until then, do not set the repository analytics flag to `true` in Preview or Production merely to activate custom events. Recheck current official [Web Analytics limits](https://vercel.com/docs/analytics/limits-and-pricing) and [Custom Events documentation](https://vercel.com/docs/analytics/custom-events) at decision time.

## Runtime controls

The one kill switch is:

```text
NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true
```

Only the exact lowercase string `true` enables the root page-view integration and the closed custom-event emitters. Missing, empty, `TRUE`, `1` and every other value are off. This variable is intentionally public and contains no secret.

The root `beforeSend` contract is:

- `/program` and nested routes: origin plus pathname only; query and fragment removed;
- `/admin` and nested routes: no page view;
- `/api` and nested routes: no page view;
- ordinary public routes: provider-default page-view URL, preserving safe acquisition attribution.

Analytics delivery failures log only a fixed event name and failure category. Product behaviour continues without analytics.

## Event dictionary and denylist

The exact 15-event dictionary and property values are normative in RFC-026 section 4 and enforced by `lib/analytics/product-analytics-events.ts`. Product code receives named methods, not a generic tracking API. The runtime parser rejects extra keys, missing keys, open strings, invalid Mission numbers and invalid action positions. Every event has at most two properties. `programme_home_viewed` has exactly `currentMission` and `engagementDayBucket`; `programmeState` is absent and must not be recreated as a third property.

Never add any of the following without a new approved RFC:

- user, account, auth-provider, session, journey or claim identity;
- IP address, digested IP, user agent, email, name or token;
- situation, audio, transcript, clarification, prompt, output or Starting Point content;
- Review, Mission, boundary, support, research, rehearsal or final-plan wording;
- XP totals, money, health/addiction information or risk/readiness/intent scores;
- operator, casino, offer, bonus or affiliate destination identity;
- arbitrary metadata, nested objects, free text, dynamically constructed names or URLs.

Programme discovery events contain only the three approved source surfaces and five fixed public route labels. They cannot be consumed by commercial services and cannot change ranking, eligibility or referral behaviour.

`engagementDayBucket` is derived on the server from elapsed whole days since Programme enrollment. The browser receives only the closed bucket; it does not calculate the bucket or receive the enrollment timestamp for analytics.

## Aggregate Founder report

Run only from an authorised operator process:

```bash
VERCEL_TOKEN=<operator-process-secret> npm run analytics:programme -- --since 7d
```

Or use an explicit inclusive date range:

```bash
VERCEL_TOKEN=<operator-process-secret> npm run analytics:programme -- --from 2026-08-01 --to 2026-08-11
```

The report queries Vercel's aggregate Web Analytics endpoint only. It requests event counts grouped by event name and closed properties. It does not query application tables, visitor rows or identities. `VERCEL_TOKEN` is read only from the process environment and is never printed or accepted as a CLI argument.

Output includes M1 activation, voice/text mix, bounded later-day Programme home views by current Mission and engagement-day bucket, M2–M10 completion continuation, Review openings, Programme completion, discovery clicks and AI/voice reliability. Completion is read from `programme_completed`, not a removed Home-state dimension. `N/A` is emitted for zero denominators. All percentages are labelled aggregate event continuation, not cohort-perfect retention.

On Hobby, the report's custom-event portion remains unavailable/empty until Founder Office manually approves Vercel Pro and separately approves flag activation. Codex made no plan change; code-package incremental recurring cost remains USD 0.

## Activation checklist

1. Confirm RFC-026 remains approved and the PR exact head passed all gates.
2. Recheck current Vercel plan, included usage, retention and Custom Events availability.
3. Obtain Founder approval for any non-zero recurring commitment. No approval is implied by this runbook.
4. Verify Preview/Production `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` is absent before the change.
5. If approved, add exact `true` only to the explicitly authorised environment and redeploy that environment.
6. Verify `/admin` emits no page view and `/program?private=value#fragment` is represented only as `/program`.
7. Use normal test/Preview interactions only. Never manufacture Production funnel or commercial events.
8. Run the aggregate report and verify it contains no raw identifiers or content.
9. Record provider plan, activation environment, deployment SHA and rollback owner.

## Rollback

Remove the flag or set it to anything other than exact `true`, then redeploy the affected environment. If provider collection must also stop, disable Web Analytics in the Vercel project after confirming the kill-switch deployment is Ready. Rollback does not modify Programme data, rewards, migrations or provider database state.
