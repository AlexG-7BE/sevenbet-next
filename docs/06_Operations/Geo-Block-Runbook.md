# Country Geo-Block and Owner Bypass

Founder instruction, 28 Sep 2026: close b4gamble.com to visitors from
Kazakhstan (KZ) and keep a personal owner bypass through a signed cookie.

## How it works

The block has three layers. Each layer refuses a request before any content is
served, and before any CDN cache lookup.

| Layer | Covers | Response | Configured in |
| --- | --- | --- | --- |
| `middleware.ts` → `lib/security/geo-block.ts` | Pages, API routes, RSC navigation payloads, `sitemap.xml`, `robots.txt`, `llms.txt`, SVG and other documents | HTTP 451 page, `Cache-Control: private, no-store`, `noindex` | Vercel environment variables |
| Vercel Firewall custom rule (`lib/security/geo-block-firewall-rule.ts`) | Assets that skip middleware: `/_next/*`, raster images, fonts, `favicon.ico` | HTTP 403 | Vercel Firewall (Production) |
| Cloudflare WAF custom rule | `media.b4gamble.com` (uploaded casino and banner media, served by Cloudflare) | HTTP 403 | Cloudflare dashboard |

- The country comes only from `x-vercel-ip-country`, and only on a Vercel
  Production or Preview runtime (`lib/jurisdiction/request-country.ts`). Vercel
  sets this header itself, so a client cannot supply it. DNS for `b4gamble.com`
  is DNS-only in Cloudflare, so requests reach Vercel directly (DETECTED on
  28 Sep 2026: `server: Vercel`, no `cf-ray`).
- If the country is unknown, the request passes and middleware logs
  `geo_block.country_unknown` with the host and path only. The log holds no IP,
  query string or user agent. The owner path is logged as `[owner-path]`.
- The 451 page is self-contained. It has inline CSS under a nonce, the text
  wordmark and a `data:` icon. It loads no other resource and has no links,
  offers, forms, scripts or trackers.
- Middleware runs before the Vercel cache, and the Firewall runs before the
  cache too. A blocked visitor therefore never receives a cached page, and the
  private 451 response is never cached for anyone else.

## Owner bypass

- Unlock: `https://b4gamble.com<OWNER_UNLOCK_PATH>?key=<OWNER_BYPASS_KEY>`.
  - The key is compared in constant time.
  - A match sets `b4g_owner` (`HttpOnly; Secure; SameSite=Lax; Path=/;
    Domain=b4gamble.com; Max-Age=31536000`) and redirects (303) to `/`.
- The cookie holds `v1.<issuedAt>.<HMAC-SHA256(OWNER_BYPASS_KEY)>`, never the
  key. The server also rejects a token older than one year.
- Changing `OWNER_BYPASS_KEY` invalidates every earlier cookie after the next
  deployment.
- A wrong key sets no cookie. The request then continues as an ordinary visit to
  that path: a 451 page in a blocked country, or the normal 404 elsewhere.
- Logout: `<OWNER_UNLOCK_PATH>/logout` deletes the cookie and redirects to `/`.
  Without the cookie, that path is an ordinary visit too.
- On a Preview host, the cookie is host-only. `vercel.app` is a public suffix,
  so the cookie cannot be shared across Preview hosts.
- A valid cookie lifts only the geo-block. The rest of the site still sees the
  visitor's real country, so KZ-specific presentation such as offers or market
  choice stays as it is for KZ.
- Treat the unlock link like a password. It lands in browser history, and the
  Vercel request log can show the full URL. If the link leaks, rotate the key.

## Environment variables

Set these in Vercel → Project `sevenbet-next` → Settings → Environment
Variables, for **Production** (and **Preview**, if Previews should behave the
same way). Environment variables apply only to deployments made after the
change, so redeploy after every edit.

| Name | Value | Notes |
| --- | --- | --- |
| `GEO_BLOCK_ENABLED` | `true` | Any other value turns the middleware block off. |
| `BLOCKED_COUNTRIES` | `KZ` | Comma-separated ISO 3166-1 alpha-2 codes. |
| `OWNER_BYPASS_KEY` | 32+ random characters | Mark it Sensitive. `openssl rand -hex 32` gives a URL-safe value; a `+` in the key would be read as a space. If it is shorter, the unlock and the bypass are disabled. |
| `OWNER_UNLOCK_PATH` | e.g. `/o-<random>` | At least 12 characters of letters, digits, `-` and `_`. `/admin…`, `/api…` and `/unlock` are refused. |

The Firewall reads none of these variables. When `BLOCKED_COUNTRIES` or
`GEO_BLOCK_ENABLED` changes, change or disable the Firewall and Cloudflare rules
to match.

## Vercel Firewall rule (static assets)

The request body comes from `geoBlockFirewallRule(["KZ"])`. Use the Vercel
Firewall API action `rules.insert`, or create the rule in Vercel → Project →
Firewall → Configure → New Rule:

- Environment equals `production`.
- Country is any of `KZ`.
- Path matches the regex `^/_next/|\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$`.
- Cookie `b4g_owner` does not exist.
- Action: Deny. Then Review → Publish.

`tests/geo-block.test.ts` checks that this pattern covers exactly the paths the
middleware matcher skips. If the matcher changes, the rule must change with it.

## Cloudflare WAF rule (`media.b4gamble.com`)

Cloudflare → `b4gamble.com` zone → Security → Security rules (WAF) → Custom
rules → Create rule → Edit expression:

```
(ip.src.country eq "KZ" and http.host eq "media.b4gamble.com" and not http.cookie contains "b4g_owner=")
```

Action: Block. Deploy. Images on the site are requested same-site, so the
owner's `Domain=b4gamble.com` cookie reaches `media.b4gamble.com`.

## Entry points (DETECTED 28 Sep 2026)

| Address | Behaviour |
| --- | --- |
| `b4gamble.com` | Production; all three layers apply. |
| `www.b4gamble.com` | Vercel domain redirect (308) to the apex before any content. |
| `http://…` | 308 to HTTPS. |
| `sevenbet-next.vercel.app` | Middleware redirect (308) to `b4gamble.com`. Its static assets are Production assets and fall under the Firewall rule. |
| Deployment and Preview URLs (`*-alexg-7bes-projects.vercel.app`) | Vercel Authentication (`all_except_custom_domains`): team members only. Middleware blocks there too when the variables are set for Preview. |
| Vercel IP addresses | Vercel serves no project without a known host (403 or redirect to vercel.com). |
| `media.b4gamble.com` | Cloudflare; covered only by the Cloudflare rule. |

## Manual checks after deployment

1. From KZ, without the cookie (or with any KZ exit, such as a VPN or
   Globalping): `curl -sI https://b4gamble.com/en` → `451`,
   `cache-control: private, no-store, max-age=0`.
2. From KZ, `curl -sI https://b4gamble.com/sitemap.xml` and
   `/api/public/bonuses` → `451`. `curl -sI https://b4gamble.com/favicon.ico` →
   `403` (Firewall).
3. Open the unlock link in a browser from KZ. It redirects to `/` and the site
   opens. DevTools → Application → Cookies shows `b4g_owner`: HttpOnly, Secure,
   Domain `.b4gamble.com`, about one year.
4. Edit the cookie value in DevTools and reload → 451.
5. Open the unlock link with a wrong key in a private window → the 451 page, and
   no cookie is set.
6. From another country (Globalping, e.g. a DE probe):
   `curl -sI https://b4gamble.com/en` → `200`.
7. Open `<OWNER_UNLOCK_PATH>/logout` → the cookie is gone and the next page is
   451.
