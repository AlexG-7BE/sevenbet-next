# Partner Portal Data Handoff

**DETECTED / RELEASE CANDIDATE — 3 September 2026:** operational input guide for
`commercial-activation-bundle.v1` and `commercial-asset-manifest.v1`.

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

## Activation sequence

From the repository root, set `<bundle>` to the completed local JSON path.

1. Validate structure:

   `npm run commercial:activation:validate -- <bundle>`

2. Preview database changes without mutation:

   `npm run commercial:activation:preview -- <bundle>`

   Inspect every `CREATE`, `UPDATE`, `UNCHANGED`, `CONFLICT`, `REJECT`, and `MISSING_DEPENDENCY` result. Do not apply while the preview is blocked.

3. Apply the exact bundle with an authorized admin UUID and explicit bundle confirmation:

   `npm run commercial:activation:apply -- <bundle> --actor-id <admin-uuid> --confirm <bundle-id>`

4. Verify committed state and CTA readiness:

   `npm run commercial:activation:verify -- <bundle>`

   `verified: true` means the exact data was committed. `productionReady: true` additionally means the existing jurisdiction, PartnerRoute, commercial, referral, and redirect authorities all permit the CTA. The adapter never changes those authorities.

5. Repeat steps 2–4 with the same bundle if needed. A repeat produces zero changed records.

## Asset sequence

Set `<manifest>` and `<asset-root>` to the completed manifest and local binary directory.

1. `npm run commercial:assets:validate -- <manifest>`
2. `npm run commercial:assets:preview -- <manifest> --source-root <asset-root>`
3. `npm run commercial:assets:apply -- <manifest> --source-root <asset-root> --actor-id <admin-uuid> --confirm <manifest-id>`

Preview validates containment, checksum, MIME type, dimensions, exact Casino × GEO × offer ownership, activation-bundle association, publication authority, expiry, and duplicate state before uploading anything. Retry is safe: matching processed content for the same exact owner is reused.

## Final checks

1. Confirm activation verification shows the intended exact Casino × GEO only.
2. Confirm no conflict or rejected record was applied.
3. Confirm assets are attached to the exact market and offer.
4. Verify the public CTA only if `productionReady` is true; do not manufacture authority.
5. Run `npm run affiliate:health -- --casino <casino-slug> --geo <country-code>`.
6. Use the authorized outbound-click report at `GET /api/admin/affiliate/outbound-clicks?from=YYYY-MM-DD&to=YYYY-MM-DD&countryCode=PE` after real governed traffic exists.

Normal partner campaign, linking-code, tracking, and asset ingestion is now an operational data procedure. A separate authority/legal decision can still keep a CTA fail-closed; that is not something this adapter bypasses.
