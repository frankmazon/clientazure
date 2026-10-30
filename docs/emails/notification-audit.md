# Email notification audit — 30 October 2026

The repository's submission email HTML uses `{{contact.email}}` for login. The API's password-reset email contains a temporary code and no Client ID. Portal notification labels use the client's email. Internal database IDs, GHL custom fields and webhook identifiers remain record keys; replacing those values would break integrations.

The saved GHL workflow emails could not be inspected: both the local and production integrations returned HTTP 401, `The token is not authorized for this scope`, when listing email templates. No GHL email templates were modified and no test notifications were sent. The plugin directory did not return a GoHighLevel integration.

The existing GHL integration needs Email Builder read/write access (`emails/builder.readonly` and `emails/builder.write`) before a live template audit can continue. Check email subjects, previews, HTML and plain text for Client ID merge fields; use `{{contact.email}}` for the displayed client identifier and label it “Email address”. Include client submission, password-change, document reminders and referrer notifications. Workflow-local copies must also be checked; updating a reusable template alone does not establish that all workflow copies were updated.

The frontend and API now share equivalent answer-based checklist rules. Direct Client and Referral requirements use property, self-employment and tax-return answers. Broker requirements retain the legacy transaction checklist and include payslips when the client is not self-employed. An outstanding document is required and neither approved nor waived; pending and rejected files remain outstanding. API GHL synchronization now supplies these same outstanding and required document lists. Missing uploads remain a separate API field so upload reminders retain their existing meaning.

References: [HighLevel template scopes](https://ideas.gohighlevel.com/changelog/public-apis-are-now-available-for-email-builder-template), [workflow template copies and sync](https://help.gohighlevel.com/support/solutions/articles/155000005553-managing-email-templates-in-workflow-steps).
