Every decision on this project came back to one question: **where does the data actually come from?**

Monitoring tools feel like magic until you realize there's no magic involved. CPU usage? It's a text file. Container stats? It's an HTTP request to a Unix socket. Nginx traffic? A single line of config exposes it. The trick is knowing where to look and how to read what you find.

Here's what I decided early on:

**Custom Node.js, no frameworks.** Consistent with everything else on this server. The HTTP server, routing, static file serving, and WebSocket handling are all built by hand. Express would have saved some lines, but wouldn't have taught me anything.

**Read from the source.** Instead of shelling out to tools like `top` or `htop` and parsing their output, I read directly from `/proc` — the pseudo-filesystem where the Linux kernel exposes system information in real time. It's what those tools read under the hood anyway.

**Docker Engine API over the Unix socket.** Docker exposes a full REST API at `/var/run/docker.sock`. You can make HTTP requests to it just like any other API — you're just sending them over a socket instead of a network port.

**In-memory ring buffer for history.** No database for metrics storage. A ring buffer holds the most recent 10 minutes of readings and automatically discards anything older. Simple, fast, zero dependencies.

**WebSockets for real-time streaming.** Instead of the frontend polling for updates every few seconds, the server pushes new data to all connected clients the moment it's collected.
