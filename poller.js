// Server-side uptime poller. Holds the latest { status, lastChecked, since }
// for each project in memory and refreshes it on a fixed interval. The status
// rule is deliberate: ANY HTTP response (any status code) means "up" — only a
// network error, DNS failure, refused connection, or timeout means "down".

let projects = [];
let timeoutMs = 5_000;
let intervalMs = 30_000;
let timer = null;

// id -> { status: 'up'|'down'|'unknown', lastChecked: ISO|null, since: ISO|null }
const state = new Map();

export function init(projectList, { timeoutMs: t = 5_000, intervalMs: i = 30_000 } = {}) {
    projects = projectList;
    timeoutMs = t;
    intervalMs = i;
    state.clear();
    for (const project of projects) {
        state.set(project.id, { status: 'unknown', lastChecked: null, since: null });
    }
}

// Records the outcome of a single poll, handling the `since` transitions:
// stamp a fresh `since` only when a project (re)enters the up state; clear it
// whenever it goes down.
function applyResult(id, isUp) {
    const now = new Date().toISOString();
    const prev = state.get(id) || { status: 'unknown', since: null };
    const status = isUp ? 'up' : 'down';

    let since = prev.since;
    if (isUp) {
        if (prev.status !== 'up') since = now; // first observed up, or down -> up
    } else {
        since = null; // clear/reset on a down transition
    }

    state.set(id, { status, lastChecked: now, since });
}

export async function pollOne(project) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        // redirect: 'manual' so a 301/302 (typical for auth walls) counts as a
        // response immediately, without a second network round-trip.
        await fetch(project.url, { signal: controller.signal, redirect: 'manual' });
        applyResult(project.id, true); // any response = up
    } catch {
        applyResult(project.id, false); // network error / DNS / refused / timeout = down
    } finally {
        clearTimeout(timeout);
    }
}

// Poll every project concurrently. allSettled so one hung app never stalls the
// rest of the board.
export async function pollAll() {
    await Promise.allSettled(projects.map((project) => pollOne(project)));
}

export function start() {
    pollAll();
    timer = setInterval(pollAll, intervalMs);
}

export function stop() {
    if (timer) clearInterval(timer);
    timer = null;
}

// Returns a snapshot of poller state keyed by project id. The server merges
// this with projects.json to build the sanitized API response.
export function getStatus() {
    const snapshot = {};
    for (const [id, s] of state) {
        snapshot[id] = { status: s.status, lastChecked: s.lastChecked, since: s.since };
    }
    return snapshot;
}
