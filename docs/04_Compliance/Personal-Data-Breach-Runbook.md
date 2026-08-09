# Personal-Data Breach Runbook

- **Status:** Operational launch control
- **Incident lead:** Founder Office until named Privacy/Security leads are recorded
- **Last reviewed:** 2026-08-09

## Trigger

Use this runbook for suspected accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to personal data. Examples include exposed credentials, an unrestricted DSAR file, cross-account Programme access, provider compromise, sensitive narrative in logs, unintended commercial use of protected data or a lost staff device/session.

## First response

1. Open a restricted incident record with UTC discovery time, reporter and minimum facts. Do not paste affected personal content into general chat, issue titles or logs.
2. Preserve relevant deployment SHA, request IDs, bounded logs, configuration history and access records. Do not preserve more user content than necessary.
3. Contain access: revoke affected sessions/credentials, disable the route or deployment, use the affiliate kill switch where relevant, restrict files and contact the processor. Do not destroy evidence.
4. Assign Incident, Privacy, Engineering and Communications owners. Contact qualified counsel for uncertain or high-risk cases.
5. Establish when SevenBet became aware, affected systems, data classes, people/regions, likely volume, recipients, encryption/access state, duration and ongoing risk.

## Risk and notification assessment

Privacy records whether the event is a personal-data breach, the likely consequences for people, severity and likelihood, containment, residual risk, and the notification decision.

Where notification to the ICO is required, prepare it without undue delay and, where feasible, within 72 hours after awareness. If information is incomplete, use phased updates and record the reason for delay. Where the breach is likely to result in a high risk to people, assess direct communication without undue delay unless a documented exception applies. Counsel/Privacy approves the decision; Engineering does not infer the legal threshold alone.

Record the facts, effects, remedial action and reasons even when the decision is not to notify.

## Communications

User communication must be clear and practical: what happened, affected data, likely consequences, containment, steps the person can take, SevenBet contact and ICO complaint rights. Do not minimise uncertainty, claim absolute safety or disclose another person's data.

Processor notices, regulator messages and user drafts stay in the restricted incident record. Public statements require Founder Office and legal approval.

## Recovery and closure

1. Verify containment in Preview and Production without mutating affected user data unnecessarily.
2. Patch the root cause and add regression tests.
3. Reapply erasure/restriction decisions if a backup restore reintroduces affected rows.
4. Confirm credentials and access are rotated/reviewed.
5. Record notification outcomes, follow-up requests, lessons and owners/dates.
6. Update the DPIA, retention/processor register and architecture decision where processing materially changes.

## Minimum incident-register fields

Reference; discovery and awareness timestamps; reporter; owners; systems/SHA; data classes; affected data subjects and jurisdictions; approximate records; recipients; containment; risk assessment; ICO decision/deadline/reference; user-communication decision/time; processor notices; evidence locations; remediation; closure approval; follow-up review.
