# Partner Portal Data Handoff

**CURRENT STATUS:** evidence-collection guide; legacy activation APPLY retired
by PR4. The historical `commercial-activation-bundle.v1` and
`commercial-asset-manifest.v1` procedures do not grant current Commercial
authority.

This is the one morning handoff. No Prisma knowledge is required. Work on one exact Casino × GEO record at a time; never infer one market’s authority from another.

## What to collect

For every Casino × GEO, collect the real current portal values:

- Casino name and existing B4GAMBLE slug;
- country/GEO, currency, and language;
- affiliate network and existing or portal programme ID;
- programme name, operator identity, and account reference;
- offer name and offer ID;
- campaign name and campaign ID;
- linking code and tracker/link ID;
- exact HTTPS tracking URL and destination URL;
- current market approval/status shown by the partner;
- evidence source type and portal/document reference;
- observation time, verification time, reviewer, and expiry;
- the final expected host/path and attribution parameter names;
- only evidence requirements that are actually satisfied.

Do not collect or paste passwords, cookies, session tokens, API keys, private authentication headers, KYC documents, or customer data.

For assets, collect:

- logo/banner/creative file;
- partner creative ID;
- Casino, GEO, and language;
- network, programme ID, and offer ID;
- asset type, MIME type, dimensions, and SHA-256;
- publication evidence/reference, observation and verification times;
- expiry and restrictions exactly as shown.

## Files

1. Copy `data/commercial-activation/incoming/commercial-activation-bundle.template.json` to a new date/source-specific JSON file in the same directory.
2. Replace every required `null`; delete optional properties only when no value exists. The template is intentionally invalid and cannot be applied accidentally.
3. Put authorized asset binaries below `data/commercial-activation/incoming/assets/` or another access-controlled local directory.
4. Copy `data/commercial-activation/incoming/commercial-asset-manifest.template.json` and use paths relative to the chosen asset root.
5. The incoming directory ignores everything except its inert templates and `.gitkeep`. Never force-add real tracking URLs or commercially sensitive partner exports unless the repository’s protected-data policy explicitly authorizes it.

## Current handoff boundary

Partner and CRM work supplies factual research, relationships, terms and
history. It does not activate a route. Current canonical writes require an
explicit trusted Founder authority established inside the process-local
Commercial Core boundary, followed by exact `MarketActivation` and governed
`/r` verification. PR5 exposes no MCP, HTTP or CLI replacement caller.

The retained bundle tooling has only these current meanings:

1. `npm run commercial:activation:validate -- <bundle>` validates the closed
   historical bundle shape without database mutation.
2. `npm run commercial:activation:preview -- <bundle>` performs read-only
   compatibility inspection.
3. `npm run commercial:activation:verify -- <bundle>` performs read-only
   comparison against current state.
4. **DO NOT RUN** `npm run commercial:activation:apply`. It is permanently
   retired and fails with `COMMERCIAL_ACTIVATION_LEGACY_WRITE_RETIRED_BY_PR4`.

There is no operator-facing current APPLY instruction. Do not replace the
retired path with CRM authority or reconnect MCP.

## Historical activation sequence — DO NOT RE-RUN

Before PR4, the bundle workflow used the following sequence. It is preserved
only to interpret old evidence and must not be executed as current operations.

1. Validate structure:

   `npm run commercial:activation:validate -- <bundle>`

2. Preview database changes without mutation:

   `npm run commercial:activation:preview -- <bundle>`

   Inspect every `CREATE`, `UPDATE`, `UNCHANGED`, `CONFLICT`, `REJECT`, and `MISSING_DEPENDENCY` result. Do not apply while the preview is blocked.

3. The former mutation step is retired; there is no current bundle APPLY.

4. Read-only comparison used:

   `npm run commercial:activation:verify -- <bundle>`

   Historical `verified: true` meant the exact legacy graph was present. It is
   not current activation authority; exact `MarketActivation` and the governed
   public-action boundary decide current behavior.

5. Repeat steps 2–4 with the same bundle if needed. A repeat produces zero changed records.

## Historical asset sequence

This sequence records the former partner-creative handoff. It does not create
current public or Commercial authority. Current Product media is limited to
the separately governed logo/B4GAMBLE-editorial policy; historical promotional
assignments remain inert.

Set `<manifest>` and `<asset-root>` to the completed manifest and local binary directory.

1. `npm run commercial:assets:validate -- <manifest>`
2. `npm run commercial:assets:preview -- <manifest> --source-root <asset-root>`
3. `npm run commercial:assets:apply -- <manifest> --source-root <asset-root> --actor-id <admin-uuid> --confirm <manifest-id>`

Preview validates containment, checksum, MIME type, dimensions, exact Casino × GEO × offer ownership, activation-bundle association, publication authority, expiry, and duplicate state before uploading anything. Retry is safe: matching processed content for the same exact owner is reused.

## Final checks

1. Confirm the factual Partner/Casino evidence and exact GEO are explicit.
2. Confirm no retired bundle or media assignment is treated as permission.
3. Verify current exact `MarketActivation` and governed `/r` behavior through
   the separately authorised Commercial Core boundary.
4. Run `npm run affiliate:health -- --casino <casino-slug> --geo <country-code>`.
5. Use the authorized outbound-click report at `GET /api/admin/affiliate/outbound-clicks?from=YYYY-MM-DD&to=YYYY-MM-DD&countryCode=PE` only after real governed traffic exists.

Campaign, linking-code and tracking evidence collection remains operational.
It is not itself a write or activation procedure. A separate authority/legal
decision can keep a CTA fail-closed; neither CRM nor this handoff bypasses it.
