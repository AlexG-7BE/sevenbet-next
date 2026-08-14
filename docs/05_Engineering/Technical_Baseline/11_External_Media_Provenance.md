# External Media and Provenance Baseline

## Audit scope

- **Detected:** repository root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` at base `1d160b94481c7f8915619ef2254c7c2e66ab3209` and RFC-033 branch changes.
- **Detected:** the active scan covered 1,003 non-ignored repository files. Dependencies, `.next/`, coverage, browser artefacts, caches and `tsconfig.tsbuildinfo` were excluded.
- **Detected:** source, styles, versioned public assets, CMS media projection, editorial embeds and documentation were searched for production-facing image, video, audio, iframe and external-URL use.

## Source-coded image inventory

| Previous Pexels CDN ID | Detected previous use | First-party file now used | Source/provenance status | Privacy and availability decision |
| --- | --- | --- | --- | --- |
| `34947154` | 10 Steps account boundary; Programme portrait | `/home/hero-confidence.jpg` | **Detected:** existing versioned asset and prior design QA mapping. **Not detected:** archived Pexels page, photographer name or model release. | **Detected:** browser delivery is now same-origin; the direct Pexels request and external availability dependency are removed. |
| `5710657` | 10 Steps hero; Programme planning | `/home/hero-plan.jpg` | **Detected:** existing versioned asset and prior design QA mapping. **Not detected:** archived Pexels page, photographer name or model release. | **Detected:** browser delivery is now same-origin; the direct Pexels request and external availability dependency are removed. |
| `37057075` | 10 Steps editorial contract; Programme outcome | `/home/hero-outcome.jpg` | **Detected:** existing versioned asset and prior design QA mapping. **Not detected:** archived Pexels page, photographer name or model release. | **Detected:** browser delivery is now same-origin; the direct Pexels request and external availability dependency are removed. |
| `4450147` | 10 Steps returning hero; Programme studio | `/home/hero-creator.jpg` | **Detected:** existing versioned asset and prior design QA mapping. **Not detected:** archived Pexels page, photographer name or model release. | **Detected:** browser delivery is now same-origin; the direct Pexels request and external availability dependency are removed. |

- **Detected:** the Pexels general licence reviewed on 2026-08-14 permits website/app use and modification without mandatory attribution, subject to restrictions including no implied endorsement and no offensive presentation of identifiable people: <https://www.pexels.com/license/>.
- **Not detected:** per-asset evidence proving photographer attribution, source-page history, releases or the licence state at the original download time. The general licence is not presented as proof of a model release.
- **Detected:** no new third-party asset was downloaded or copied in RFC-033. The implementation reuses files versioned by the earlier Home migration.
- **Detected after RFC-033:** no `images.pexels.com` runtime URL remains in application or component source.

## Governed runtime media

### Published CMS images

- **Detected:** published casino image records accept only a root-relative URL or HTTPS URL in Production; credentials in URLs, inactive assets and malformed records fail closed.
- **Detected:** public images render the reviewed asset URL directly. An HTTPS storage host can therefore receive ordinary request metadata such as IP address, user agent and the referrer allowed by B4GAMBLE's `strict-origin-when-cross-origin` policy.
- **Detected:** uploaded media is type/size/dimension/signature validated, metadata-stripped during processing, stored through the configured provider and associated with required alternative text except favicons.
- **Inferred:** a configured same-site media origin has a smaller third-party privacy surface than a separate storage origin. Exact Production storage host and provider ownership are deployment configuration, not established by source alone.
- **Planned:** publication review must continue to verify rights, credit and privacy for each managed asset. Source validation establishes transport safety, not copyright or release authority.

### Editorial video embeds

- **Detected:** editorial review blocks use a closed provider choice: `youtube-nocookie.com` or `player.vimeo.com`. Iframes are lazy, carry a strict-origin-when-cross-origin referrer policy and use a sandbox limited to scripts, same-origin and presentation.
- **Inferred:** opening an embed still creates a request to the selected provider and exposes ordinary request metadata. The privacy-enhanced YouTube host does not make the provider first-party.
- **Not detected:** a currently published repository fixture proving that either provider is active on a public Production article.
- **Planned:** another video host requires an RFC-033 media/CSP review before release.

## First-party delivery

- **Detected:** versioned assets under `public/` are served from B4GAMBLE's origin. Local CSS image references are root-relative.
- **Detected:** `next/font` packages Archivo into the application build; the browser does not fetch the font from Google.
- **Detected:** the RFC-033 CSP keeps same-origin, `data:` and `blob:` image support and permits HTTPS only for governed published CMS media. Frame permission is limited to the two detected editorial providers.

## Residual release conditions

1. **Not detected:** complete historical per-file provenance/releases for the four legacy Pexels images. This remains a rights-record gap even though direct hotlink privacy and availability risk are closed.
2. **Not detected:** source-only proof of the configured Production media storage host. Hosted verification can observe request hosts but must not expose configuration values.
3. **Detected on RFC-033 Preview:** local Chromium/WebKit and exact deployment `dpl_HSr19yfu1hmRmrYzMmdPaMqiUJRN` showed no Pexels request and no unexpected image, media or frame CSP violation on representative public, Help, Learn, auth, Programme, admin and error routes.
