const fs = require('fs');
const path = require('path');
const { parse } = require('marked');

// In-memory cache — populated once at startup by loadAll()
const projects = [];

/**
 * Scans the showcases/ directory, reads every manifest + markdown file,
 * and stores the fully parsed results in the projects array.
 * Call this once at server startup.
 */
function loadAll() {
    const showcasesDir = path.join(__dirname, '..', 'showcases');

    // If no showcases directory exists yet, just skip gracefully
    if (!fs.existsSync(showcasesDir)) {
        console.warn('No showcases/ directory found — skipping content load.');
        return;
    }

    const folders = fs.readdirSync(showcasesDir);

    for (const folder of folders) {
        const manifestPath = path.join(showcasesDir, folder, 'manifest.json');

        // Skip any folder that doesn't have a manifest
        if (!fs.existsSync(manifestPath)) continue;

        // Read and parse the manifest
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(raw);

        // Read and parse each section's markdown file
        for (const section of manifest.sections) {
            const mdPath = path.join(showcasesDir, folder, section.file);

            if (fs.existsSync(mdPath)) {
                const markdown = fs.readFileSync(mdPath, 'utf-8');
                section.content = parse(markdown);
            } else {
                console.warn(`Missing file: ${mdPath}`);
                section.content = '<p>Content not found.</p>';
            }
        }

        projects.push(manifest);
        console.log(`Loaded showcase: ${manifest.slug}`);
    }

    console.log(`${projects.length} showcase(s) loaded.`);
}

/**
 * Returns lightweight project summaries for the home page card grid.
 * No section content included — just metadata.
 */
function getAllProjects() {
    return projects.map(project => ({
        slug: project.slug,
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        thumbnail: project.thumbnail
    }));
}

/**
 * Returns the full project data (including parsed section HTML) for a given slug.
 * Returns null if no matching project is found.
 */
function getProjectBySlug(slug) {
    return projects.find(project => project.slug === slug) || null;
}

module.exports = { loadAll, getAllProjects, getProjectBySlug };