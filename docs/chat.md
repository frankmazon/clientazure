# Client and admin messages

The admin inbox is at `/dashboard/messages`. Existing client-row Messages buttons open that client's thread. Clients use the message button in the fixed top header to open a compact chat at the bottom-right over the document dashboard. The notification bell opens its dropdown below the header; the old bottom buttons and Messages card have been removed. Minimize and Close keep the current draft until the portal is left. The adjacent bell opens incoming-message alerts.

Both interfaces share `ChatDashboard.tsx`. Threads refresh every 5 seconds; the admin conversation list refreshes every 15 seconds. Requests run sequentially, stop when the view closes, and time out after 35 seconds. Messages are plain text (up to 2,000 characters), with separate drafts per conversation. Unread incoming-message badges are stored per signed-in reader in SQL. Attachments and sender-visible read receipts are not implemented. Alerts appear inside the portal while signed in; they are not browser push notifications or email.

The admin notification bell includes unread client conversations. Opening a thread acknowledges incoming messages actually loaded while the page is visible. The client bell and chat button show unread admin replies. Alert polling runs every 10 seconds; minimized chat pauses thread polling.

## Backend dependency and rollout

This frontend requires the changes in `/Users/frank/docs-upload-api/function_app.py`:

- Successful admin/client login returns an eight-hour signed `chatToken`. Admin tokens require `Users.Role` to be `Admin` or `Administrator` (case insensitive).
- `GET /api/chat` lists client conversations for admins. `GET /api/chat?clientId=...` reads a thread. `POST /api/chat` accepts `{clientId, message}`. All require `Authorization: Bearer <chatToken>`.
- Client sessions are restricted to their own client ID. The server supplies sender identity. Existing messages remain in `dbo.ClientMessages`; both `Client` and `Admin` SenderType values must be accepted by that existing table.
- `GET /api/chat/notifications` returns unread conversations; `PATCH` accepts `{clientId, lastMessageId}` to acknowledge only messages through that incoming message. Read positions never move backwards. The backend creates `dbo.ChatReadState` on first use with serialized initialization; the database user needs table-creation permission for first setup. Existing incoming messages initially count as unread.
- Configure `CHAT_SESSION_SECRET` with a strong random value shared by all Function instances. The existing SQL password is a compatibility fallback. Changing the signing secret invalidates chat sessions.
- Legacy unauthenticated notes endpoints return 410 to prevent bypassing chat authorization. Coordinate frontend/backend releases; stale pages must reload.

Deploy both repositories together and sign out/in after deployment to get a chat token. This work has only been validated locally; live Azure SQL integration has not been tested.

## Validation

Frontend: `npm run build`.
Backend: `python3 -m unittest discover -s tests -v` in the backend repository.
Browser checks used mocked API responses: admin reply, client reply, existing history, failed-send draft retention, conversation switching, mobile navigation, admin bell navigation, client reply alerts, read-badge clearing, popup minimize/draft retention, and mobile layout.

## Portal refresh behavior

The client/referrer portal saves an allowlisted account profile, chat token, password-change requirement and fixed eight-hour expiration in `sessionStorage` (`sbr.portalSession.v1`). Refresh restores that tab's session and reloads client files. Passwords and document data are never persisted. Logout removes the saved session; expired or malformed sessions return to login. The stored profile restores UI state only; signed chat API authorization remains server-side.

Session regression tests: `node --test tests/portalSession.test.mjs`. Browser checks with mocked APIs covered login → refresh, file reload, chat-token restoration, logout → refresh, expired/corrupt storage, and mandatory password change after refresh.
