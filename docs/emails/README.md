# GHL client submission email

`ghl-client-submission.html` is the replacement email body based on the supplied GHL HTML. It keeps the logo, branding, login fields, portal button, and footer, and adds a Privacy Statement and Authority document link.

The signing frontend and backend must be deployed before using this email in the live workflow. The link requires a client portal login; it is not a passwordless or per-borrower invitation. Signed documents are reopened through that same authenticated page. No automatic confirmation email is implemented yet.

In the GHL Client Submission Confirmation email action:
1. Replace the HTML body with this file's contents.
2. Remove the existing PDF from the action's attachments. Attachments are configured separately and were not present in the supplied HTML; changing HTML alone does not remove them.
3. Save the action and preview the email. Verify the existing contact merge fields and document link with a test contact before live use.

No GHL workflow was edited and no emails were sent by creating this file.
