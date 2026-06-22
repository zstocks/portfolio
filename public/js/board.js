// Living system board — fetches /api/status on load, then polls every ~20s,
// patching status dots in place. Never flashes everything to "down": on a
// failed fetch it simply keeps the last known render.

const POLL_MS = 20_000;

const grid = document.getElementById('project-grid');
const updatedEl = document.getElementById('last-updated');
let built = false;

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function dotClass(status) {
    return status === 'up' ? 'up' : status === 'down' ? 'down' : 'unknown';
}

function statusLabel(status) {
    return status === 'up' ? 'Up' : status === 'down' ? 'Down' : 'Checking…';
}

function accessBadge(access) {
    return access === 'public' ? 'Live · try it' : 'Live · login required';
}

// Honest relative time. `since` only reflects when the poller last saw the app
// come up (it resets on redeploy), so the label says exactly that.
function relativeTime(iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
}

function metaText(p) {
    if (p.status === 'up' && p.since) return `up since ${relativeTime(p.since)}`;
    if (p.status === 'down') return p.lastChecked ? `last checked ${relativeTime(p.lastChecked)}` : 'down';
    return 'checking…';
}

function cardHtml(p) {
    const tags = p.tags.map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('');
    const github = p.github
        ? `<a class="card-link github" href="${encodeURI(p.github)}" target="_blank" rel="noopener">GitHub</a>`
        : '';
    return `
    <article class="project-card" data-id="${escapeHtml(p.id)}">
        <div class="card-head">
            <span class="status-dot ${dotClass(p.status)}" data-role="dot" title="${statusLabel(p.status)}"></span>
            <h2>${escapeHtml(p.name)}</h2>
        </div>
        <p class="card-blurb">${escapeHtml(p.blurb)}</p>
        <div class="card-tags">${tags}</div>
        <div class="card-meta">
            <span class="access-badge ${escapeHtml(p.access)}">${accessBadge(p.access)}</span>
            <span class="card-since" data-role="meta">${metaText(p)}</span>
        </div>
        <div class="card-links">
            <a class="card-link visit" href="${encodeURI(p.url)}" target="_blank" rel="noopener">Visit ↗</a>
            ${github}
        </div>
    </article>`;
}

function updateCard(p) {
    const card = grid.querySelector(`[data-id="${CSS.escape(p.id)}"]`);
    if (!card) return;
    const dot = card.querySelector('[data-role="dot"]');
    dot.className = `status-dot ${dotClass(p.status)}`;
    dot.title = statusLabel(p.status);
    card.querySelector('[data-role="meta"]').textContent = metaText(p);
}

function render(data) {
    if (!built) {
        grid.innerHTML = data.projects.map(cardHtml).join('');
        built = true;
    } else {
        data.projects.forEach(updateCard);
    }
    if (updatedEl) updatedEl.textContent = `updated ${relativeTime(data.updatedAt)}`;
}

async function refresh() {
    try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) return; // keep last known state
        render(await res.json());
    } catch {
        // network blip — keep the board as-is rather than flashing to down
    }
}

refresh();
setInterval(refresh, POLL_MS);
