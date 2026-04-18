With data flowing through the WebSocket, the frontend's job was to visualize it. The UI is a single HTML page with Chart.js handling the graphs.

The layout is split into three areas:

**System gauges** at the top show CPU usage, memory usage, and disk usage as real-time values that update every 5 seconds. These give you an instant read on overall server health.

**Container cards** show each Docker container's status, uptime, memory consumption, and restart count. If a container is down, the card reflects that immediately. This replaced what PM2 monitoring would have handled before I migrated to Docker.

**Time-series charts** plot CPU and memory over the 10-minute window stored in the ring buffer. When the page loads, the WebSocket connection fires and the server sends the full buffer contents — so the charts populate with history instantly rather than starting from a blank canvas and slowly filling in.

The Chart.js update cycle was the interesting part. When a new WebSocket message arrives, the frontend parses it, pushes the new data point onto the chart's dataset, and calls `chart.update('none')`. The `'none'` parameter skips the animation — important for real-time data where you're updating every 5 seconds. With animation enabled, the chart would constantly be in motion and harder to read.

The Nginx section shows active connections and a request rate counter, giving a sense of how much traffic the server is handling at any given moment.

Everything is served as static files from the dashboard's `public/` directory — plain HTML, CSS, and vanilla JavaScript. No build step, no bundler, no frontend framework.
