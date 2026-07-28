# Editorial Builder Technical Debt Report

| Issue | Impact | Recommendation | Priority |
| --- | --- | --- | --- |
| Editorial revisions do not currently expose an optimistic-concurrency token. | Concurrent editors can each create a valid revision without being notified that another editor saved first. | Add a repository-owned revision precondition and a conflict-resolution UI in a governed follow-up. | High |
| The existing media selector is specialised for casino, bonus, social, and affiliate assignments. | Editorial image blocks currently reference an existing canonical media asset ID instead of offering an in-context picker. | Extend the existing media manager with an editorial-reference picker; do not create a second asset store. | Medium |
| Preview tokens are created per refresh and expire after at most one hour. | Open preview tabs can expire during extended editorial sessions. | Add a visible expiry indicator and a renewal control if editorial sessions routinely exceed this duration. | Low |
| Structured validation currently has blocking issues only. | The builder cannot distinguish editorial warnings from publication blockers. | Add severity to the established editorial validation contract only after a reviewed content-policy decision. | Medium |
