The API endpoints gave me snapshots, but a dashboard needs history. "What's the CPU at right now?" is useful. "What has the CPU looked like over the last 10 minutes?" is a chart.

### The Ring Buffer

A ring buffer is a fixed-size circular array. You write to it sequentially, and when you reach the end, it wraps around and starts overwriting the oldest entries. At 5-second intervals with 120 slots, it holds exactly 10 minutes of history — and memory usage never grows.

Think of it like a circular track: you keep writing forward, and old data drops off the back. No database, no cleanup jobs, no growing memory footprint. When the buffer is full, the write position wraps back to index 0 and the oldest reading disappears.

A collector module runs on a `setInterval` — every 5 seconds it gathers a complete metrics snapshot from all sources and pushes it into the ring buffer. The REST API endpoints then read from the buffer instead of collecting fresh metrics per request.

### WebSocket Streaming

Normal HTTP is request-response: the client asks, the server answers, the connection closes. If the frontend wanted live updates through HTTP, it would have to poll — sending a new request every 5 seconds. That works, but it's wasteful.

WebSocket is a different protocol. It starts as an HTTP request (the "upgrade handshake") and then stays open as a persistent two-way connection. Once connected, the server pushes data to the client whenever it wants — no polling, no repeated handshakes.

The dashboard uses the `ws` package for this. When a client connects over WebSocket, two things happen: first, the server sends the full ring buffer contents so the frontend can populate its charts with historical data immediately. Then, every 5 seconds when the collector runs, it broadcasts the latest snapshot to every connected client.

The result: you open the dashboard and charts are already populated with 10 minutes of history. New data points appear in real time without the page ever making another HTTP request.
