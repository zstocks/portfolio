This project taught me more about how Linux works than anything else I've built.

Before the dashboard, `/proc` was just a mysterious directory. Now I know it's where the kernel publishes real-time system data as plain text files — and that every monitoring tool in existence is just reading from the same source. Understanding that removed an entire layer of mystique around DevOps tooling.

The Docker Engine API was a similar revelation. I'd been using the `docker` CLI as a black box. Learning that it's just an HTTP client talking to a Unix socket changed how I think about Docker — it's not magic, it's an API like any other, just with a different transport mechanism.

WebSockets were the first time I'd built anything truly real-time. The shift from request-response to persistent connections opened up a whole new category of things I can build — chat, live collaboration, multiplayer games. The ring buffer pattern for bounded-memory history storage is something I'll use again.

Building auth from scratch — HMAC signing, session cookies, protecting both HTTP and WebSocket routes — forced me to think about security at every layer rather than trusting a middleware package to handle it.

### What's running now

The dashboard is live at [admin.zacharystocks.com](https://admin.zacharystocks.com), monitoring the server that hosts this portfolio and every other app I've built. It collects metrics every 5 seconds, streams them to any connected browser, and pings me on Discord if something goes sideways.

### What's next

Future ideas include container management (restart, stop, and remove containers directly from the dashboard), process-level monitoring via `/proc/[pid]/stat`, long-term metrics storage in SQLite, and web analytics integration. The foundation is there — each of those is an extension of something already built.
