import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ACCESS_VALUES = new Set(['public', 'private']);

function fail(message) {
    console.error(`[config] ${message}`);
    process.exit(1);
}

function positiveIntFromEnv(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) {
        fail(`${name} must be a positive integer, got "${raw}".`);
    }
    return value;
}

function validateProject(entry, index) {
    const where = `projects.json[${index}]`;
    if (typeof entry !== 'object' || entry === null) fail(`${where} must be an object.`);

    for (const field of ['id', 'name', 'blurb', 'url', 'access']) {
        if (typeof entry[field] !== 'string' || entry[field].length === 0) {
            fail(`${where}.${field} must be a non-empty string.`);
        }
    }
    if (!/^https?:\/\//.test(entry.url)) {
        fail(`${where}.url must start with http:// or https://`);
    }
    // Fail fast at boot on a URL the regex accepts but the parser rejects
    // (e.g. an empty host), so the poller never trips on it later.
    if (URL.parse(entry.url) === null) {
        fail(`${where}.url is not a valid URL: "${entry.url}".`);
    }
    if (!ACCESS_VALUES.has(entry.access)) {
        fail(`${where}.access must be "public" or "private", got "${entry.access}".`);
    }
    if (!Array.isArray(entry.tags) || entry.tags.some((t) => typeof t !== 'string')) {
        fail(`${where}.tags must be an array of strings.`);
    }
    if (entry.github !== null && typeof entry.github !== 'string') {
        fail(`${where}.github must be a string URL or null.`);
    }
}

// Reads + validates all configuration at startup. Any problem exits the
// process rather than starting in a half-broken state (house rule).
export function validateConfig() {
    const config = {
        // Bind to all interfaces inside the container. Docker forwards the
        // published port via the container's network interface (not loopback),
        // so binding to 127.0.0.1 here would make the app unreachable -> 502.
        // Host-side exposure is restricted by the compose mapping
        // (127.0.0.1:3002:3000), which is where the "localhost only" rule lives.
        host: process.env.HOST || '0.0.0.0',
        port: positiveIntFromEnv('PORT', 3000),
        pollIntervalMs: positiveIntFromEnv('POLL_INTERVAL_MS', 30_000),
        pollTimeoutMs: positiveIntFromEnv('POLL_TIMEOUT_MS', 5_000),
    };

    const projectsPath = join(__dirname, 'projects.json');
    let raw;
    try {
        raw = readFileSync(projectsPath, 'utf8');
    } catch (err) {
        fail(`cannot read ${projectsPath}: ${err.message}`);
    }

    let projects;
    try {
        projects = JSON.parse(raw);
    } catch (err) {
        fail(`projects.json is not valid JSON: ${err.message}`);
    }

    if (!Array.isArray(projects) || projects.length === 0) {
        fail('projects.json must be a non-empty array.');
    }

    const ids = new Set();
    projects.forEach((entry, i) => {
        validateProject(entry, i);
        if (ids.has(entry.id)) fail(`duplicate project id "${entry.id}".`);
        ids.add(entry.id);
    });

    return { config, projects };
}
