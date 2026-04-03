const http = require('http');
const fs = require('fs');
const path = require('path');
const loader = require('./src/loader');
const renderer = require('./src/renderer');

const PORT = 3000;
const APP_NAME = 'portfolio';

// File extension to MIME type mapping for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

/**
 * Attempts to serve a static file from public/.
 * Returns true if the file was found and served, false otherwise.
 */
function serveStaticFile(req, res) {
    const filePath = path.join(__dirname, 'public', req.url);
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext];

    if (!mimeType) return false;

    // Prevent path traversal
    const resolved = path.resolve(filePath);
    const publicDir = path.resolve(path.join(__dirname, 'public'));
    if (!resolved.startsWith(publicDir)) return false;

    if (!fs.existsSync(filePath)) return false;

    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
    return true;
}

const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/html' });
        res.end('<h1>405</h1><p>Method not allowed.</p>');
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Health check
    if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: APP_NAME }));
        return;
    }

    // Home page
    if (pathname === '/') {
        const projects = loader.getAllProjects();
        const html = renderer.renderHome(projects);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
    }

    // Showcase page
    if (pathname.startsWith('/showcase/')) {
        const slug = pathname.split('/')[2];
        const project = loader.getProjectBySlug(slug);

        if (project) {
            const html = renderer.renderShowcase(project);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404</h1><p>Project not found.</p>');
        }
        return;
    }

    // Static files
    if (serveStaticFile(req, res)) return;

    // Fallback 404
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404</h1><p>Page not found.</p>');
});

loader.loadAll();

server.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}`);
});