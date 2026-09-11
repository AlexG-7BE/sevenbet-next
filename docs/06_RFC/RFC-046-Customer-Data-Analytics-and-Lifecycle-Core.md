# RFC-046 — Customer Data, Analytics and Lifecycle Core

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 11 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE Customer
Data, Analytics & Lifecycle — Production Core v1`.

**Depends on:** Product Vision & Principles v2.0, RFC-002, RFC-013, RFC-014,
RFC-015, RFC-017, RFC-018, RFC-020, RFC-021, RFC-022, RFC-023, RFC-025,
RFC-028, RFC-036, RFC-037, RFC-039, RFC-042, RFC-044, RFC-045 and the
Programme engineering standards.

**Supersedes and amends:**

- RFC-036 is superseded only for its permanent hard-disable of public product
  analytics. Its necessary-technology, legal-evidence, Programme, Help,
  commercial-firewall and accepted-deferral decisions remain active.
- RFC-018 is amended to activate the bounded account, lifecycle and marketing
  communication purposes in this RFC. Google remains identity-only and account
  creation remains distinct from marketing permission.
- RFC-028 remains the authority for the isolated Contact-to-support flow. This
  RFC reuses the verified Resend sending provider but does not merge Contact
  message handling into customer lifecycle email.

## 1. Decision

B4GAMBLE will operate one relational, first-party Customer Data, Analytics and
Lifecycle Core inside the existing Next.js, Better Auth, Prisma/PostgreSQL and
Vercel application. The existing Better Auth `User` remains the only
registered-customer identity authority. No parallel customer identity, data
warehouse, generic workflow engine, custom BI layer or second redirect system
is introduced.

The Core adds:

1. bounded customer metadata and an internal customer registry;
2. a closed, versioned analytics event contract with deterministic anonymous,
   session and authenticated identities;
3. first-party event/session storage and fixed reproducible metrics;
4. server-authoritative Programme state observations;
5. granular internal click attribution integrated after RFC-042 routing
   authority;
6. current email eligibility plus append-only consent history;
7. versioned fixed email templates, messages, provider outcomes, lifecycle
   sends and reviewed broadcasts;
8. signed provider webhooks and opaque unsubscribe tokens; and
9. fixed Founder, Programme, Commercial and Email dashboards.

The system is deliberately a small operational core. It is not a sales CRM,
CDP, campaign language, recommendation engine, revenue-attribution platform or
general-purpose analytics product.

## 2. Authority and failure ordering

Authentication remains identity authority. Programme persistence remains
Programme state authority. RFC-042 and its legal, jurisdiction, operator,
commercial and route-health dependencies remain the sole positive and negative
commercial routing authority. Consent and suppression state remain final email
send authority.

The mandatory order is:

```text
authentication / Programme / RFC-042 / consent authority
→ authoritative product decision
→ best-effort analytics or delivery observation
```

Analytics storage failure cannot fail signup, login, Programme persistence,
page rendering or a safely resolved redirect. Attribution failure cannot
convert a block into an allowed redirect. Email-provider failure cannot roll
back a valid account or Programme mutation. Public and lifecycle failures use
bounded structured logs with no email, raw IP, Programme wording, provider
secret, authentication token or affiliate destination.

## 3. Customer identity and metadata

`User.id` is the stable customer identifier and `User.email` is the
authentication-owned address. A database unique index over the normalized
lower-case, trimmed email prevents case-only duplicate registrations without
introducing a second identity table. Customer-operational fields may extend
`User` additively for account state, locale, lawful signup GEO, bounded
acquisition fields and last activity.

Email is Customer PII and never an analytics identifier. Analytics may refer to
`userId`, but never copies email into an event. Anonymous history may be
linked to the authenticated user only after the same consented browser session
authenticates; the existing event is updated rather than duplicated.

Current email eligibility is purpose-specific state associated one-to-one with
the user. Material grants, denials, withdrawals, unsubscribes and provider
suppressions also create immutable consent events. Cookie/statistical
preference and email-marketing permission are separate authorities.

## 4. Analytics identity, consent and sessionization

The hierarchy is:

```text
anonymous_id → session_id → User.id when authenticated
```

The analytics preference cookie stores only the signed grant or denial and is
used solely to remember that choice. Anonymous and session identifier cookies
are first-party, opaque and created only after the analytics grant. They are
not email, auth or commercial authority.

A session identifier is issued with the consent grant, while its relational
session row begins only at the first accepted event. It has one random stable
UUID and expires after 30 minutes without accepted activity. A later event
rotates the expired session. The anonymous ID
is stable for the bounded configured lifetime unless consent is withdrawn or
browser storage is cleared. Canonical timestamps are UTC.

Local and Preview traffic is environment-tagged and excluded from Production
Founder metrics. Obvious bot traffic is rejected or marked and excluded.
Production test traffic uses a server-held exact internal marker and is
excluded. Neither locale nor client input creates GEO authority; country and
market context come only from B4GAMBLE's trusted request-country architecture.

### PECR assessment

The ICO's final April 2026 storage-and-access guidance describes a narrow
statistical-purpose exception where the sole purpose is aggregate service
improvement, users receive clear information and a simple free objection, no
individual tracking or decisions occur, and personal event data is removed
after aggregation. It explicitly excludes individual visitor tracking,
conversion linkage and online-advertising/affiliate measurement.

This Core intentionally supports authenticated journeys, durable sessions and
commercial click attribution. It therefore does **not** rely on that exception
for browser identifiers or client event collection. Those technologies remain
off until an affirmative analytics choice. Server-side operational records
created without reading optional browser storage—such as the result of an
RFC-042 redirect attempt—are separately purpose-limited, minimized and
disclosed. Identity, placement and source enrichment is omitted when the
analytics grant is absent.

Sources:

- [ICO storage and access technology exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
- [ICO consent management for storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/)

## 5. Canonical events and ingestion

There is one closed v1 dictionary:

```text
session_started
page_viewed
signup_completed
login_completed
programme_started
programme_step_viewed
programme_step_completed
programme_completed
casino_viewed
offer_viewed
commercial_cta_clicked
outbound_redirect_attempted
outbound_redirect_succeeded
outbound_redirect_blocked
email_sent
email_delivered
email_bounced
email_clicked
email_unsubscribed
```

Each event has a UUID, schema version, UTC occurrence/receipt time,
environment/traffic classification and only explicit bounded dimensions.
There is no arbitrary properties JSON column. Unknown keys and values are
rejected. Event UUID and dedupe-key constraints make client retry and
server-observer replay idempotent. A bounded batch is processed per event, so
one malformed item does not discard valid siblings.

Client events are limited to observations that cannot be established reliably
on the server: consented page, view and CTA interactions. Signup/login,
persisted Programme completion, redirect result and provider outcomes are
server authoritative. Programme events contain only mission number and
structural state. They never contain typed answers, transcripts, audio,
Starting Point wording, Help use, pause behavior or other vulnerability
content.

For v1, a casino view is a rendered casino-review page. An offer view is a
published offer card or review offer block intersecting the viewport. Its
stable card key exists only as a browser dedupe marker; it is not promoted to
an `AffiliateOffer` foreign key. Demo fixtures never emit offer views.

## 6. Programme observations and purpose limitation

The Core observes `ProgramEnrollment`, `ProgrammeMissionProgress` and their
existing completion timestamps. It creates deterministic observations from
those canonical records and never creates an analytics progress state.
Programme completion is never inferred from a page view.

Programme observations may support aggregate product analysis, continuation
and user-requested reminders. They must never select, rank, time or personalize
a casino, offer, bonus, affiliate link or advertisement for an individual.
Commercial reports and segments have no Help, pause, self-check, sensitive
authority, narrative, confidence, boundary or vulnerability inputs.

## 7. Commercial click attribution

The existing `/r/{slug}` handler generates a random internal `click_id` at
request entry. It then runs the unchanged RFC-042 resolution chain. Only after
that chain returns does a best-effort observer store exactly one final
outbound-attempt record and the attempted plus succeeded-or-blocked canonical
events.

A click row may contain the canonical casino, offer, network, coarse GEO,
locale, source page and placement available at the decision. Anonymous,
session, user, source-page and placement enrichment is accepted only with the
analytics grant. The internal click ID never replaces or alters the affiliate
destination and is not forwarded as a partner token.

The governed client may add only a closed source/placement label to its
internal `/r/{slug}` URL. That label is observational input, never routing or
eligibility authority, and is discarded unless it passes the bounded grammar.

Raw destination/tracking URLs and credentials remain confined to the
server-owned redirect authority. They are absent from click/event rows,
frontend HTML, client telemetry, dashboards, customer views, general logs and
errors. The existing daily aggregate remains as a backwards-compatible
successful-click projection while fixed dashboards use explicit
attempt/success/block states.

## 8. Email, lifecycle and broadcast

Resend is reused as a server-only delivery provider behind a purpose-neutral
transport. Contact retains its separate RFC-028 adapter. The new adapter can be
constructed only by exact Production configuration and uses provider
idempotency keys in addition to database uniqueness. This release deliberately
does not invoke that adapter from a route, Better Auth callback or cron, so
configuration alone cannot send a lifecycle message. Resend documents a
24-hour provider idempotency window; B4GAMBLE's environment-scoped database
keys remain durable beyond that window.

The bounded purposes are:

- email verification, password reset and account security: transactional;
- welcome: non-marketing lifecycle/account onboarding with no casino promotion;
- Continue Programme reminder: consent-required lifecycle email; and
- manual broadcast: consent-required marketing email.

An unchecked, separate marketing choice is recorded at signup where offered.
Account creation and Google authentication never imply a grant. At the final
send boundary every lifecycle/marketing recipient is re-read from current
email preference, verification and suppression state. Unsubscribed or
suppressed users cannot leave through a normal marketing path. Known
all-delivery suppression also blocks transactional attempts.

Welcome and Programme reminder jobs use fixed, environment-scoped idempotency
keys. Reminder selection excludes identities that already hold the same
purpose/template/environment intent so an early 500-row page cannot starve
later eligible identities. A reviewed broadcast stores explicit fixed filters,
an estimated eligible count and separate suppressed/unsubscribed exclusions;
execution creates one unique message per campaign and user. Campaigns and
messages are environment-tagged and their idempotency keys are unique within
that environment. Provider idempotency values use opaque subject digests and
do not disclose internal customer identifiers. A browser refresh cannot send
again. One invalid recipient
fails only that message. Retries are bounded.

Provider webhooks are verified against the raw body and Resend/Svix signature
headers before parsing. The unique `svix-id` is the durable replay key.
Only delivered, bounced, clicked and complaint/suppression outcomes are
normalized. Complaint suppression is not represented as a customer
unsubscribe. Raw payloads and clicked URLs are not retained.

Sources:

- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [ICO direct electronic-mail marketing guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/)
- [Better Auth email verification and reset hooks](https://better-auth.com/docs/concepts/email)

## 9. Templates and unsubscribe

Templates have a stable key, closed purpose/type, locale, subject, sanitized
HTML, plain-text fallback, integer version, active state and staff audit
metadata. An unavailable locale falls back to approved English; B4GAMBLE does
not invent legal or gambling-marketing translations.

Editing creates an auditable version. Test-send uses a dedicated test purpose
and subject marker and can address only the authenticated staff user's own
email. It cannot become a campaign.

Template version, activation and test-queue changes and campaign
create/review/queue transitions are recorded in the existing relational staff
audit ledger. Audit metadata contains identifiers, bounded filters and counts,
not template bodies or recipient addresses.

Marketing and Programme-reminder messages contain an opaque, message-bound
HMAC unsubscribe token. Only its one-way hash is stored. GET displays a
confirmation page; an idempotent POST consumes the token, records withdrawal
and immediately blocks later marketing. Replaying an already-consumed token
reapplies suppression if a later preference change removed it. The link
exposes neither user ID nor email. Provider unsubscribe or complaint outcomes
reconcile into the same current authority.

## 10. Data subject and retention behavior

Customer export includes the new customer metadata, current preferences,
consent history, messages, provider outcomes and identity-linked analytics.
It excludes password material, auth and reset tokens, unsubscribe token hashes,
provider credentials and affiliate destinations.

Account erasure deletes Customer/email PII, consent history and the subject's
linked event/click observations, then removes the subject's linked analytics
identifiers and sessions. Anonymous-identity expansion never captures a row
explicitly linked to another user, even if legacy rows share a pseudonym.
Only non-identifying aggregate/business integrity may remain where permitted.
Admin/staff profiles retain the existing manual legal-review block.

Individual analytics retention is bounded and must be revisited before volume
or purpose expands. The default individual-event/click/session horizon is 395
days; terminal email-message history defaults to 730 days. Each scheduled run
deletes at most 5,000 rows per collection and reports only aggregate counts.
No event contains raw IP. Email addresses are retained only
in customer/email records protected by staff authorization and are erased by
the data-subject workflow.

## 11. Internal access and reference lock

The existing Better Auth staff session, `AdminUser` roles and server-side
permission checks remain the only internal authorization path. `user.view`
governs Customer PII, `analytics.view` governs fixed dashboards, and new
`email.manage` and `template.manage` permissions are limited to Admin and
Super Admin. Every API repeats its own permission check; navigation visibility
is not security.

### Refero reference lock

**Build target:** the existing B4GAMBLE `AdminShell` and the current
Commercial Operations list/detail workbench.

**Traits that must not drift:** dark navy canvas; existing sans/serif tokens;
gold action, green verified and warning-only semantic accents; 280-pixel
desktop sidebar; list-first dense tables; four-column summary metrics; visible
zero and failure states; existing field, badge, radius and focus treatments;
single-column mobile fallback.

**Borrowed details:** Commercial Operations owns table density, fact grids,
timeline and truthful empty states. Existing admin login/forms own control and
focus behavior. New dashboards use compact semantic bars and tables rather
than decorative card mosaics.

**Rejected directions:** a disconnected light SaaS application, new indigo or
gradient palette, charting dependency, generic card wall, arbitrary dashboard
builder, decorative animation and mobile horizontal data loss.

### Decision ledger

| Decision | Reason | Source |
| --- | --- | --- |
| Extend the existing admin shell | Preserves authorization, navigation and visual continuity | `AdminShell`, Admin page policy |
| List-first customer and campaign screens | Operators need identity/status scanning before detail | Existing Commercial queue/directory |
| Fixed range controls and metric definitions | Reproducible decisions outweigh generic exploration | Founder instruction |
| CSS/table trends before a chart package | Four bounded dashboards do not justify a runtime dependency | Existing design system and performance rule |
| Fixed Programme-state broadcast filters only; never answers, Help, pause, vulnerability, casino/offer ranking or affiliate selection | Implements the explicit Founder audience requirement without turning safety data into commercial targeting | Founder instruction; Product Vision; RFC-002/017/025 |

## 12. Migration, deployment and rollback

Migration `0037_customer_data_analytics_lifecycle_core` is additive. It adds
enums, nullable/defaulted User metadata, normalized-email uniqueness, new
tables, foreign keys, checks and reporting indexes. It neither deletes nor
rewrites Programme/commercial/auth records. Template seed rows are fixed
operational configuration, not fake customers or analytics.

Before Production application rollout:

1. verify actual User volume and normalized-email duplicate count;
2. apply all pending migrations in order, including 0036;
3. run schema/migration integrity probes;
4. deploy application code with provider delivery disabled by default;
5. verify customer, analytics, redirect, email-disabled and admin boundaries;
6. retain lifecycle delivery disabled until outbound customer-data transfer is
   explicitly authorised and the sender invocation is separately reviewed;
7. configure the exact provider/webhook secrets only in Production;
8. register and verify the signed webhook endpoint; and
9. in an authorised follow-up, connect the bounded processor, enable delivery,
   run one controlled test and inspect provider state.

Rollback disables analytics client collection and email delivery by exact
configuration and redeploys the prior application. The additive schema remains
in place so rollback does not destroy data. RFC-042 route and safety behavior
does not depend on the new tables.

## 13. Explicit non-scope

This RFC does not implement partner revenue, registrations/FTD, NGR,
commission, partner API/CSV ingestion, multi-touch revenue attribution,
predictive segmentation, churn or lifetime-value scores, heatmaps, replay,
experiments, generic reports/SQL, reverse ETL, Kafka, microservices, push/SMS/
WhatsApp, a sales CRM, a segment/query language or commercial personalization
from Programme/Help/vulnerability data.

## 14. External evidence boundary

Repository and historical provider evidence shows the `b4gamble.com` Resend
sending domain was verified for the RFC-028 Contact purpose. That does not
prove the new webhook is registered, its Production signing secret exists, the
new delivery variables are configured, or a lifecycle message is delivered.
Those are verified only against the live provider and Production environment.

The implementation candidate intentionally queues welcome, reminder, test and
broadcast messages but does not connect a live route, Better Auth callback or
cron to the external send processor. This is a release hold, not evidence that
delivery works. Activating that transfer requires an explicit authorised
follow-up plus provider/domain/webhook verification; configuration alone does
not cause a queued message to leave B4GAMBLE.

The standing RFC-036 processor/transfer and account-applicability evidence
levels continue. This RFC does not fabricate a contract acceptance, transfer
mechanism, deliverability result, DNS state or legal approval.
