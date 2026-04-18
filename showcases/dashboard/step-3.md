Nginx has a built-in module called `stub_status` that exposes basic traffic metrics. Enabling it is a single `location` block in the Nginx config — I set it to only respond to requests from localhost so it's not publicly accessible.

The module returns a plain text response with active connections, total accepted connections, total handled requests, and how many connections are currently reading, writing, or waiting. It's not much, but it's enough to see traffic patterns and spot anomalies.

The collector fetches this endpoint over HTTP, parses the text response, and calculates a request rate by comparing the current total against the previous reading.

### The REST API

With all three data sources wired up — system metrics from `/proc`, container stats from the Docker socket, and traffic data from Nginx — the next step was exposing them through clean API endpoints:

- **`/api/system`** — CPU, memory, disk, load average, uptime
- **`/api/containers`** — status, memory usage, and restart count for each Docker container
- **`/api/nginx`** — active connections, request rate, and connection states
- **`/api/metrics`** — a combined snapshot of everything above in one response

Each endpoint returns JSON. At this point the dashboard was already useful — you could `curl` any endpoint from the terminal and get a clear picture of the server's state. But the real goal was a live UI, and that required solving two more problems: storing history and streaming updates.
