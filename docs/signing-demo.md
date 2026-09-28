# Privacy statement signing sample

Open `/signing-demo`. The webpage reproduces the Privacy Statement and Authority supplied in the screenshot. No emails are sent and nothing is deployed by this sample.

Successful submission in the public form captures borrower names, co-borrower names only when selected, client reference, and the completion timestamp into session storage. The signing sample reads this snapshot on the same origin and browser tab. It does not treat document-upload timestamps as form-submission dates. Without a snapshot, fictional one-borrower/two-borrower controls demonstrate both layouts.

Names are read-only. Each borrower has an independent drawing pad and confirmation checkbox. Every listed signature is required. The About Us date uses the submission timestamp; signature rows show the date the individual drawing was captured. Dates display in Australia/Melbourne time. The submitted sample snapshots names, submission date, signature images and signing timestamps into local storage; reopening its link in that browser shows the saved read-only copy.

This is not yet a production email-signing workflow: cross-device access, authenticated per-signer links, independent signer audit records and real confirmation emails still require integration. The separate authenticated database flow is described below. The browser snapshot does not cross the public-site/dashboard subdomain boundary. Earlier version-1 demos must be restarted to use the new template.

Validated with a production build and mocked browser checks covering one/two borrowers, all required signatures, saved images after refresh, automatic names/date from a submission snapshot and mobile overflow.

## Database-connected portal document

`/privacy-document` is the authenticated account version, separate from `/signing-demo`. The client dashboard links to it. It calls `GET /api/privacy-document` with the existing signed client session token. The backend derives the client ID from the token; callers cannot choose another client's record.

The page uses `Clients.SubmittedAt` (the stored calendar date), primary borrower names, and `ClientCoBorrowers`. Co-borrowers appear only when `WithBorrowersGuarantors` is `Yes`. A Yes flag with no saved co-borrowers blocks signing so an incomplete document cannot be finalized. A No flag suppresses stale co-borrower records.

`POST /api/privacy-document` requires all displayed signatures and consent, checks the submission revision, assigns server signing timestamps, and stores an immutable snapshot in `dbo.ClientPrivacyDocuments`. The primary key allows one completed privacy document per client; repeated submissions return the existing completed document. Reopening while signed in retrieves the same signatures from SQL. This is a shared client-session signing flow, not independently authenticated co-borrower invitations. Real invitation/confirmation emails and per-signer links remain unimplemented.

Database validation on 2026-09-28: authenticated reads passed for six saved submissions (five single borrower, one with co-borrower); temporary test client/document round-trip passed and was rolled back. The new empty document table was created in the configured database. No real client signatures were created. Frontend and backend still need deployment before this route is available on the hosted portal.
