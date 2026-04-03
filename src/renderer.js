const fs = require('fs');
const path = require('path');

// Read all templates once at startup
const templatesDir = path.join(__dirname, 'templates');
const layout = fs.readFileSync(path.join(templatesDir, 'layout.html'), 'utf-8');
const homeTemplate = fs.readFileSync(path.join(templatesDir, 'home.html'), 'utf-8');
const showcaseTemplate = fs.readFileSync(path.join(templatesDir, 'showcase.html'), 'utf-8');

/**
 * Wraps page content in the shared layout shell.
 * Replaces tokens: PAGE_TITLE, CONTENT, NAV_ACTIVE_*, SCRIPTS
 */
function wrapInLayout(content, options = {}) {
    const title = options.title ? `${options.title} — Zachary Stocks` : 'Zachary Stocks';
    const activePage = options.activePage || '';
    const scripts = options.scripts || '';

    return layout
        .replace('{{PAGE_TITLE}}', title)
        .replace('{{CONTENT}}', content)
        .replace('{{NAV_ACTIVE_HOME}}', activePage === 'home' ? 'active' : '')
        .replace('{{NAV_ACTIVE_ABOUT}}', activePage === 'about' ? 'active' : '')
        .replace('{{NAV_ACTIVE_CONTACT}}', activePage === 'contact' ? 'active' : '')
        .replace('{{SCRIPTS}}', scripts);
}

/**
 * Builds a single project card for the home page grid.
 */
function buildProjectCard(project) {
    const tags = project.techStack
        .map(tech => `<span class="tech-tag">${tech}</span>`)
        .join('');

    return `
        <a href="/showcase/${project.slug}" class="project-card">
            <div class="card-thumbnail">
                <img src="${project.thumbnail}" alt="${project.title}" />
            </div>
            <div class="card-body">
                <h2>${project.title}</h2>
                <p>${project.description}</p>
                <div class="card-tags">${tags}</div>
            </div>
        </a>
    `;
}

/**
 * Renders the home page with the project card grid.
 */
function renderHome(projects) {
    const cards = projects.map(buildProjectCard).join('');
    const content = homeTemplate.replace('{{PROJECT_CARDS}}', cards);

    return wrapInLayout(content, { activePage: 'home' });
}

/**
 * Builds a single showcase section with optional emote.
 * Each section is a div that the client-side JS shows/hides.
 */
function buildSection(section, index) {
    // Build emote HTML only if the section has one
    let emoteHtml = '';
    if (section.emote) {
        const position = section.emote.position || 'bottom-right';
        emoteHtml = `
            <div class="emote emote-${position}">
                <img src="/images/emotes/${section.emote.type}.png" alt="${section.emote.type}" />
            </div>
        `;
    }

    return `
        <div class="showcase-section" data-index="${index}" ${index === 0 ? '' : 'hidden'}>
            <h2 class="section-title">${section.title}</h2>
            <span class="section-type">${section.type}</span>
            <div class="section-content">
                ${section.content}
            </div>
            ${emoteHtml}
        </div>
    `;
}

/**
 * Renders a full showcase page for a single project.
 */
function renderShowcase(project) {
    // Build all sections
    const sectionsHtml = project.sections
        .map((section, index) => buildSection(section, index))
        .join('');

    // Build tech stack tags
    const techTags = project.techStack
        .map(tech => `<span class="tech-tag">${tech}</span>`)
        .join('');

    // Build project links (live demo + GitHub) for the footer
    let linksHtml = '';
    if (project.liveUrl) {
        linksHtml += `<a href="${project.liveUrl}" target="_blank" class="project-link">Live Demo</a>`;
    }
    if (project.githubUrl) {
        linksHtml += `<a href="${project.githubUrl}" target="_blank" class="project-link">GitHub</a>`;
    }

    const content = showcaseTemplate
        .replace('{{PROJECT_TITLE}}', project.title)
        .replace('{{PROJECT_DESCRIPTION}}', project.description)
        .replace('{{TECH_TAGS}}', techTags)
        .replace(/{{SECTION_COUNT}}/g, project.sections.length)
        .replace('{{SECTIONS}}', sectionsHtml)
        .replace('{{PROJECT_LINKS}}', linksHtml);

    return wrapInLayout(content, {
        title: project.title,
        activePage: '',
        scripts: '<script src="/js/showcase.js"></script>'
    });
}

module.exports = { renderHome, renderShowcase };
