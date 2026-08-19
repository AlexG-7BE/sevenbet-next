# GB Article 27 Representative Assessment

- **Controller:** 7BE Inc., trading as B4GAMBLE
- **Assessment date:** 19 August 2026
- **Status:** BLOCKED — EXTERNAL ACTION REQUIRED
- **Owner:** Founder / Chief Legal & Compliance Officer

## Decision

7BE Inc. must appoint a UK representative in writing before this GB release is approved. The Article 27 exception is not safely available.

## Evidence classification

### Detected

- 7BE Inc. is established at 447 Broadway, 2nd Floor, 1663, New York, NY 10013, United States.
- No UK branch, office, other establishment or appointed UK representative is evidenced in the active repository.
- B4GAMBLE deliberately serves Great Britain, uses GB jurisdiction rules and offers persistent accounts and a ten-Mission Programme to people in the UK.
- The service records authentication/session facts, Programme access authority, progress, Mission completion, XP, active days and confirmed structured outputs over time.
- Optional typed input, audio and transcripts may reveal health or other special-category information.

### Inferred

- UK GDPR Article 3(2) applies through intentional offering of services to people in the UK and monitoring of service/Programme behaviour.
- Processing is part of a planned, ongoing service, not occasional. The conjunctive exception for processing that is occasional, low risk and does not involve large-scale special-category/criminal data cannot safely be used.
- Article 27 therefore requires a representative established in the UK. The representative is a contact for people and the ICO; appointment does not transfer the controller's responsibility or liability.

### Planned

- Appoint a person or organisation established in the UK under a signed written mandate.
- Give the representative authority to act regarding UK GDPR compliance and liaise with people and the ICO.
- Agree records-of-processing access, rights-request routing, regulator correspondence, incident escalation, availability, confidentiality, termination and evidence-retention terms.
- Retain the signed mandate and counsel approval, then populate `lib/legal/gb-uk-representative.ts` with approved public particulars.

### Not detected

- Representative legal name, UK postal address, email, contact route, signed mandate, effective date and counsel approval.

## Public Privacy field

The field belongs immediately after the controller section on `/privacy`. It must not render until every value is approved:

`Our UK representative is [LEGAL NAME], [POSTAL ADDRESS]. You may contact them at [EMAIL] or [CONTACT ROUTE] about UK data-protection matters.`

The repository record remains deliberately `null`; brackets and appointment-pending copy must not be presented as compliant launch particulars.

## Closure evidence

1. Signed mandate with effective date.
2. Evidence that the representative is established in the UK.
3. Approved legal name, postal address, email and stable contact route.
4. Rights/ICO/incident escalation runbook and responsible contacts.
5. Counsel review of the appointment and updated Privacy Notice.
6. Deterministic Preview test showing the exact public field and working contact route.

## Primary sources

- [ICO — Do we need a UK representative?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/receiving-personal-information-from-the-eea/#ukrepresentative)
- [UK GDPR text, Article 27](https://www.legislation.gov.uk/eur/2016/679/article/27)

This is an implementation-grounded compliance assessment, not a substitute for advice from retained UK counsel.
