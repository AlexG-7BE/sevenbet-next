# Launch checklist — GB, SE, DK, DE traffic from Monday 28 September 2026

Owner: Founder (decisions and confirmations) · Claude session (execution and reports).
Governing decisions: [RFC-054](../06_RFC/RFC-054-Licence-Market-Access.md) (licence
register), [MARKET-ACCESS-RELEASE-01](Market-Access-Release-01-Runbook.md) (activations).

## Target

| Market | Casinos promoted | Notes |
| --- | ---: | --- |
| GB | 19 licensed, 18 with a route | DragonBet waits for a Brothers Bet link |
| SE | 15 licensed, 14 with a route | Betsafe SE waits for a BGA link; Betsson's licensee becomes Spin Nordic Ltd on 30 Sep (licence already active) |
| DK | 10 | — |
| DE | 2 (DrückGlück, TurboNino) | Offers, buttons and `/r/` only 21:00–06:00 Europe/Berlin |

Everything else is closed by the register: offers withheld, no button, `/r/` refused
with the closure stored as the click's `blockedReason`.

## Before Monday

1. **Code in Production.** The register (#350), the release tooling (#352), the click
   check and the German copy are merged, and Vercel Production serves their merge SHA
   (`gh api repos/AlexG-7BE/sevenbet-next/deployments` or the Vercel dashboard).
2. **Activation release.** Run the runbook's `plan` against Production, compare it
   with the runbook, get the Founder's confirmation, run `apply`, keep the JSON
   report. Expected: 25 disabled, 13 enabled (EUcasino DK needs `--ego-links`).
   Any `BROKEN_ROUTE` goes back to the partner before launch.
3. **Real clicks from every market.**
   `npm run launch:click-check` clicks every casino's public `/r/` route from a
   Globalping probe in GB, SE, DK and DE and judges each response against the
   register. It never follows the redirect, so partners receive nothing, and the
   clicks are stored as `BOT` traffic. Accept only:
   - no `VIOLATION` (a closed market reaching a partner) and no `UNEXPECTED`;
   - `PASS` for every casino in the target table; `NO_ROUTE` only for DragonBet GB
     and Betsafe SE.
   Run it once between 21:00 and 06:00 Berlin (Germany `PASS` ×2) and once in the
   day (Germany `PASS_CLOSED` ×2).
4. **Pages from every market.** On a phone with a local connection (or a VPN exit
   in the market), open `/en/bonuses`, `/en/best-offers` and one licensed casino's
   review: its button leads to the operator's local site. In Germany, `/de` pages
   show no "Casino" wording, no jackpots and no table games.

## Monday and after

- **Click report.** Admin → Analytics → Commercial: *Outbound by market and
  outcome* shows, per country, the clicks that reached a partner and the reasons the
  others were refused; *Outbound by casino* and *by source page* show where they came
  from. Only `PRODUCTION` + `HUMAN` traffic is counted.
- **Partner reconciliation.** Compare partner reports with the click report per
  casino and market. EGO: `aname=b4gamble`; Superfly and BGA: their dashboards.
- **Route health.** The daily route-health workflow keeps checking every active
  route. A `CROSS_GEO` for a German route from the GitHub runner is expected — it
  is not in Germany; rerun from the market with
  `npm run launch:click-check -- --markets DE`.
- **Betsson Sweden, 30 Sep.** Betsson Nordic Ltd's licence for betsson.com/sv ends;
  Spin Nordic Ltd's licence (from 24 Aug 2026) continues the brand. No action is
  needed for the route; the register already cites the Spin Nordic entry.

## Stop conditions

- A `VIOLATION` in the click check: close the market in `lib/market-access/register.ts`
  (one line) and deploy, or disable the activation through the controller.
- A partner reports traffic from a market it refuses: same.
- A route turns `BROKEN` in a launch market (route-health issue or a `NO_ROUTE` that
  used to pass): disable it through the controller so the button stops sending
  visitors to a dead page, and tell the partner.
