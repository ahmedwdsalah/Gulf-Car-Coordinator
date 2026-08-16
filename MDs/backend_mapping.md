# Gulf Car Driver App API v1

Internal API reference for the iOS and Android driver apps.

## Contents

- [Hosts and conventions](#hosts-and-conventions)
- [01. Auth and session](#01-auth-and-session)
- [02. Bootstrap and device](#02-bootstrap-and-device)
- [03. Movement requests](#03-movement-requests)
- [04. GPS gateway](#04-gps-gateway)
- [05. Cross-cutting behavior](#05-cross-cutting-behavior)

## Hosts and conventions
Everything the iOS driver app needs to talk to: session auth, assigned movement requests, and raw position reporting to the GPS gateway. Two hosts, one driver identity carried across them.

| Service | Base URL | Authentication |
| --- | --- | --- |
| HR API | `https://hr.gulfcar.com.sa/api/v1/mobile` | HR access token |
| GPS gateway | `https://gps.gulfcar.com.sa/location` | GPS tracking token |
Both hosts require HTTPS. All bodies are JSON (Content-Type: application/json), all responses are JSON with an "ok" or "success" boolean at minimum.

## 01. Auth and session
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
/auth/logout
Bearer
Revokes the current session and clears this device's GPS tracking token server-side. No body. Response is {"ok": true}.

POST
/auth/forgot-password
no auth
Files a reset request for HR to action manually — there is no email/SMS reset flow. Always returns 202 with the same generic message regardless of whether the username exists (avoids account enumeration); design the UI copy around that.

{ "ok": true, "message": "..." }  // 202, always
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
## 02. Bootstrap and device
Call /bootstrap once per app start after login to sync org info and the tracking cadence. Device registration happens automatically inside /auth/login; /devices/register exists to re-mint the tracking token later without a full re-login.

GET
/bootstrap
Bearer
Org identity plus the server-controlled GPS reporting policy — treat every field here as authoritative over any local default.

{
  "ok": true,
  "organization": { "id": "gulfcar", "name": "Gulf Car", "tracking_url": "…" },
  "user": { "id": 32, "employee_id": 117, "employee_code": "…",
            "username": "osman", "full_name": "Osman Saeed", "email": "…" },
  "tracking_policy": {
    "mode": "manual",
    "accuracy": "high",
    "interval_seconds": 15,
    "fastest_interval_seconds": 10,
    "distance_meters": 25,
    "heartbeat_seconds": 60,
    "dropoff_radius_meters": 100,
    "offline_retention_days": 7
  }
}
`dropoff_radius_meters` is server policy metadata; this API mapping defines no client-side action for it. The driver app must not independently stop tracking or mutate movement state from this value.
POST
/devices/register
Bearer
Re-issues the GPS tracking_token for the current device — call it if the stored tracking token is lost or the gateway rejects it. Same installation_id ownership rule as login applies.

Request body
installation_id	string	required
platform, app_version, device_name	string	same as login, all optional
Response 200
{ "ok": true, "device": {
  "tracking_token": "…", "tracking_token_expires_in": 2592000,
  "provisioning_status": "ready"
}}
PUT
/devices/push-token
Bearer
Registers the APNs device token for trip/assignment notifications. Call after every push permission grant and on token rotation.

Request body
push_token	string	required · ≤ 512 chars
Response: {"ok": true}. 422 INVALID_PUSH_TOKEN if empty or oversized.

## 03. Movement requests
HR-dispatched trips (airport runs, ad-hoc pickups) assigned directly to this driver's employee_id.

GET
/movement-requests
Bearer
Lists this driver's own requests only — filtering by other employees isn't possible, the server ignores any client-supplied id.

Query
status	string	active (default, assigned + in_progress) · completed (completed + cancelled) · all
Response 200
{ "ok": true, "requests": [ {
  "id": 4821,
  "request_number": "MR-20260815-142301-9F2A1C",
  "scheduled_at": "2026-08-16T05:30:00Z",       // nullable, ISO 8601
  "pickup":  { "label": "Terminal 3, KKIA", "lat": 24.9576, "lng": 46.6988 },
  "dropoff": { "label": "Hilton Riyadh Hotel", "lat": 24.6889, "lng": 46.6851 },
  "passenger_names": "Ali Al-Qarni",
  "vehicle_label": "Tahoe — ح ك م 2015",
  "notes": null,
  "status": "assigned",           // assigned | in_progress | completed | cancelled
  "version": 1,                   // pass back unchanged on the next transition
  "started_at": null, "completed_at": null, "updated_at": "2026-08-15T14:23:01"
} ] }
POST
/movement-requests/{id}/start
Bearer
Same contract for /movement-requests/{id}/complete — swap the verb, everything else below is identical. This is an optimistic-lock state machine: start only succeeds from assigned, complete only from in_progress.

Headers
Idempotency-Key	string	required · ≤ 100 chars, unique per attempt. Safe to retry on timeout with the same key — a repeat returns the original result with "duplicate": true instead of double-applying.
Request body
expected_version	int	required · the version you last read for this request
client_time	string	ISO 8601, for audit only
Response 200 — the updated request row (same shape as the list item, version incremented).
Errors
Status	Code	Meaning
422	UPDATE_GUARD_REQUIRED	missing expected_version or Idempotency-Key
404	REQUEST_NOT_FOUND	doesn't exist, or isn't assigned to this driver
409	STATE_CONFLICT	someone else changed it first — refetch the request in the response body and re-render, don't blind-retry
## 04. GPS gateway
Host: gps.gulfcar.com.sa — the one call that uses the tracking token from login/device-register, not the HR session token.

POST
/location
Bearer (tracking token)
One position per call — there is no working batch endpoint yet, so queue offline points locally and replay them one at a time on reconnect.

Request body
client_event_id	string	required · dedupe key, e.g. {epoch_micros}-{lat}-{lng}
captured_at	string	required · ISO 8601 UTC
latitude, longitude	number	required
accuracy_m	number	meters
speed_mps	number	≥ 0 — clamp negative GPS noise to 0 before sending
heading_deg	number	0–360
altitude_m	number	optional
battery_percent	int	optional, omit if unavailable rather than sending a guess
Response 200 / 202
{ "ok": true, "accepted": 1, "duplicates": 0 }
Treat either accepted > 0 or duplicates > 0 as success — a duplicate means the gateway already has this exact point, which is a fine outcome for a retried send, not a failure to surface.
## 05. Cross-cutting behavior
Every HR endpoint
Status	Code	Meaning
401	AUTH_REQUIRED	no/empty Bearer header
401	SESSION_EXPIRED	access token expired, revoked, or the account/employee/device was deactivated — refresh once, then force re-login if that also fails
405	METHOD_NOT_ALLOWED	wrong verb for the route
413	PAYLOAD_TOO_LARGE	body over 256 KB
400	INVALID_JSON	body isn't valid JSON
404	NOT_FOUND	unknown route
500	SERVER_ERROR	unhandled — safe to retry once with backoff
Recommended client rule: on any 401, try /auth/refresh exactly once and replay the original request; a second 401 means sign the driver out. Never retry a 409 automatically — it means your local state is stale, not that the request failed.

Client mapping reviewed against the current driver-app implementation.
