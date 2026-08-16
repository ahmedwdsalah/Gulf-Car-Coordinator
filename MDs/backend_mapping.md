Gulf Car Driver App API
Everything the iOS driver app needs to talk to: session auth, assigned movement requests, the live-trip bridge into Events, and raw position reporting to the GPS gateway. Three separate hosts, one driver identity carried across all of them.

HR API
https://hr.gulfcar.com.sa/api/v1/mobile
Events API
https://events.gulfcar.com.sa/api/mobile
GPS gateway
https://gps.gulfcar.com.sa/location
All three hosts require HTTPS. All bodies are JSON (Content-Type: application/json), all responses are JSON with an "ok" or "success" boolean at minimum.

01
Auth & Session
Username/password login against the HR database — not against the phone number or driver name. A session is a 15-minute access token plus a 30-day refresh token, scoped to one installation_id.

POST
/auth/login
no auth
Authenticates a driver and mints a session + a permanent GPS tracking_token for this device in one call.

Request body
Field	Type
username	string	required
password	string	required
installation_id	string	required · stable per-install UUID, ≤ 80 chars. One installation_id = one device row; logging in from a second install under the same account is fine, a different account on an already-claimed install is rejected (see DEVICE_ALREADY_LINKED).
platform	"ios" | "android"	stored for fleet visibility
app_version	string	≤ 40 chars
device_name	string	≤ 160 chars, e.g. "Osman's iPhone 15"
Response 200
{
  "ok": true,
  "session": {
    "access_token": "…",  // 15 min TTL — send as Bearer on every authed call
    "access_expires_in": 900,
    "refresh_token": "…", // 30 day TTL — single use, rotates on refresh
    "refresh_expires_in": 2592000
  },
  "user": {
    "id": 32, "employee_id": 117, "employee_code": "OSMANALBAGER2",
    "username": "osman", "full_name": "Osman Saeed",
    "email": "osman@…", "role": "employee"
  },
  "device": {
    "installation_id": "…",
    "tracking_token": "…",              // long-lived, use on the GPS gateway
    "tracking_token_expires_in": 2592000,
    "provisioning_status": "ready"
  },
  "organization": {
    "id": "gulfcar", "name": "Gulf Car",
    "tracking_url": "https://gps.gulfcar.com.sa/location"
  }
}
Store access_token, refresh_token and tracking_token in Keychain, not UserDefaults — all three are bearer secrets.
Errors
Status	Code	Meaning
422	CREDENTIALS_REQUIRED	username or password missing
401	INVALID_CREDENTIALS	bad password, inactive account, or unlinked employee
429	TOO_MANY_ATTEMPTS	5 failed attempts in 15 min from this IP+username
409	DEVICE_ALREADY_LINKED	this installation_id belongs to a different account
403	DEVICE_REVOKED	an admin revoked this device — re-registration blocked


POST
/auth/forgot-password
no auth
Files a reset request for HR to action manually — there is no email/SMS reset flow. Always returns 202 with the same generic message regardless of whether the username exists (avoids account enumeration); design the UI copy around that.

Request body
{ "username": "osman" }

The username is trimmed before sending. Do not send access or refresh tokens.

{ "ok": true, "message": "..." }  // 202, always



POST
/auth/logout
Bearer
Revokes the current session and clears this device's GPS tracking token server-side. No body. Response is {"ok": true}.



POST
/auth/refresh
no auth
Exchanges a refresh token for a new access + refresh pair. Call this on a 401 from any HR endpoint, then retry the original request once.

Request body
refresh_token	string	required
Response 200 — same session shape as login.
Refresh tokens are single-use and rotate every call. If two requests race on the same stale token, the loser gets REFRESH_REUSED — treat that the same as an expired session (force re-login), don't retry.
Errors
Status	Code	Meaning
401	REFRESH_REJECTED	expired, revoked, or unknown token
401	REFRESH_REUSED	token already consumed — sign out and back in



POST
/provisioning/resolve
no auth
First-run flow only: an admin generates a one-time QR/link (gulfcar://provision?code=…) in the HR dashboard. Scanning it hands the app its hr_api_url and tracking_url — this is how the app finds its own backend before any login screen exists. Code expires in 10 minutes, single use.

Request body
code	string	required · the full token.signature string, or the raw gulfcar:// URL
Response 200
{
  "ok": true,
  "profile": {
    "organization_id": "gulfcar", "organization_name": "Gulf Car",
    "hr_api_url": "https://hr.gulfcar.com.sa/api/v1/mobile",
    "tracking_url": "https://gps.gulfcar.com.sa/location"
  }
}
Errors
Status	Code	Meaning
422	INVALID_PROVISIONING_CODE	malformed code
410	PROVISIONING_EXPIRED	expired, already used, or unknown
