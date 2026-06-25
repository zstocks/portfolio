import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname } from 'node:path';

import { validateConfig } from './config.js';
import * as poller from './poller.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_NAME = 'portfolio';
const PUBLIC_DIR = resolve(join(__dirname, 'public'));

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
};

const { config, projects } = validateConfig();

// projects.json never changes at runtime, so index it once for fast merging.
const projectsById = new Map(projects.map((p) => [p.id, p]));

// Board page is read once at startup; a redeploy restarts the container.
const boardHtml = readFileSync(join(PUBLIC_DIR, 'index.html'));

// Build the public API payload field-by-field from an explicit allowlist.
// Internal-only detail (ports, IPs, hostnames, file paths, poll errors) never
// touches this object — only named public fields go out.
function buildStatusPayload() {
    const live = poller.getStatus();
    const projectList = projects.map((p) => {
        const s = live[p.id] || { status: 'unknown', lastChecked: null, since: null };
        return {
            id: p.id,
            name: p.name,
            blurb: p.blurb,
            tags: p.tags,
            access: p.access,
            url: p.url,
            github: p.github,
            status: s.status,
            lastChecked: s.lastChecked,
            since: s.since,
        };
    });
    return { updatedAt: new Date().toISOString(), projects: projectList };
}

function serveStaticFile(req, res) {
    const filePath = join(PUBLIC_DIR, req.url);
    const ext = extname(filePath);
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) return false;

    // Guard against path traversal outside the public directory.
    const resolved = resolve(filePath);
    if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + '/')) return false;
    if (!existsSync(resolved)) return false;

    const content = readFileSync(resolved);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
    return true;
}

const server = http.createServer((req, res) => {
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Method Not Allowed');
            return;
        }

        // URL.parse (Node 22) returns null instead of throwing on a malformed
        // path (e.g. `//`, bad `%` escapes), so a bot probe can't crash us.
        const url = URL.parse(req.url, `http://${req.headers.host}`);
        if (!url) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Bad Request');
            return;
        }
        const { pathname } = url;

        if (pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ status: 'ok', app: APP_NAME }));
            return;
        }

        if (pathname === '/api/status') {
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
            });
            res.end(JSON.stringify(buildStatusPayload()));
            return;
        }

        if (pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(boardHtml);
            return;
        }

        if (serveStaticFile(req, res)) return;

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
    } catch (err) {
        // No single request should take down the process. If the response has
        // already started streaming we can't write a fresh status line, so
        // destroy the socket instead.
        console.error('request handler error:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal Server Error');
        } else {
            res.destroy();
        }
    }
});

poller.init(projects, { timeoutMs: config.pollTimeoutMs, intervalMs: config.pollIntervalMs });
poller.start();

server.listen(config.port, config.host, () => {
    console.log(`${APP_NAME} listening on http://${config.host}:${config.port} — polling ${projects.length} projects every ${config.pollIntervalMs / 1000}s`);
});
