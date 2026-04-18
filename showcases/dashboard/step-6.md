A monitoring dashboard that's open to the internet is a security problem — it tells an attacker everything about your infrastructure. The dashboard needed authentication, and it needed to cover both the HTTP routes and the WebSocket connection.

### HMAC Cookie Authentication

The auth system uses a password check combined with a signed session cookie. When you visit the dashboard, the server checks for a valid session cookie. If it's missing or invalid, you're redirected to a login page.

The cookie is signed using HMAC (Hash-based Message Authentication Code) with a server-side secret. When a login succeeds, the server creates a session value, computes its HMAC signature, and sets both as a cookie. On subsequent requests, the server recalculates the HMAC and compares it to the one in the cookie — if they don't match, the cookie has been tampered with and is rejected.

This works for WebSocket connections too. The initial WebSocket handshake is a regular HTTP request, so it includes cookies. The server validates the cookie during the upgrade handshake and rejects the connection before it's established if the auth check fails.

The password and signing secret live in a `.env` file that never touches version control — a lesson learned the hard way about how Docker Compose handles environment variables and special characters.

### Discord Webhook Alerts

The final piece: getting notified when something goes wrong without staring at the dashboard 24/7.

The alert system runs threshold checks on each metrics snapshot. If CPU exceeds 90%, memory passes 85%, disk crosses 90%, or any container goes down, the system fires a notification to a Discord channel via a webhook URL.

Webhooks are elegantly simple. Discord gives you a URL. You POST a JSON payload to that URL with a message. Discord displays it in the channel. No bot framework, no OAuth, no library — just a single HTTPS request from Node's built-in `https` module.

To avoid alert fatigue, the system tracks which alerts are currently active and only sends a notification when an alert *transitions* — fires when a threshold is crossed, and resolves when it drops back below. No repeated messages every 5 seconds while CPU is high.
