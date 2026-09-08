#!/usr/bin/env node
/**
 * Pull docs from the repos that OWN them into this site's docs tree.
 *
 * This site publishes knowledge it does not author. Two sibling repos are the source of
 * truth; their content is copied in here at build time and is gitignored, so it can never
 * be edited in the wrong place and drift.
 *
 *   tiktuzki-gitops   docs/operations/  ->  docs/operations/
 *                     + anything listed in its knowledge-map.yaml `publish:` block
 *   senior-architect  production-review/references/  ->  docs/production-patterns/
 *
 * Each source repo carries a `knowledge-map.yaml` supplying the Docusaurus front matter
 * for files that do not have any. That matters most for the 41 lessons: they are plain
 * markdown with no front matter on purpose, because production-review/SKILL.md links all
 * 41 by relative path and the plugin resolves them through ${CLAUDE_PLUGIN_ROOT}. 347
 * relative links run between those files, 100 crossing a "set" boundary — so the sets are
 * a graph, not a folder structure. We inject metadata into the COPY and never touch the
 * source.
 *
 * Locally this prefers a sibling checkout (../../<repo>) so unpushed edits preview; in CI
 * it shallow-clones from GitHub. Run via `pnpm sync`, or automatically through `pnpm build`.
 */
import {execFileSync} from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import yaml from 'js-yaml';

// scripts/ lives inside tik_space/ so that `js-yaml` resolves against its node_modules.
const SITE = resolve(import.meta.dirname, '..');            // .../TikTzuki/tik_space
const REPO = resolve(SITE, '..');                            // .../TikTzuki
const DOCS = join(SITE, 'docs');
const WORKSPACE = resolve(REPO, '..');                       // .../knowledge
const I18N = join(SITE, 'i18n', 'vi', 'docusaurus-plugin-content-docs', 'current');
const TMP = mkdtempSync(join(tmpdir(), 'sync-knowledge-'));
process.on('exit', () => rmSync(TMP, {recursive: true, force: true}));

const die = (msg) => {
    console.error(`error: ${msg}`);
    process.exit(1);
};
const warn = (msg) => {
    // Surfaces as a GitHub Actions annotation without failing the build. Manifest drift in
    // another repo must not take this site's nightly build down.
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::${msg}`);
    else console.log(`  warning: ${msg}`);
};

/** Resolve a repo to a local path, cloning only if no sibling checkout exists. */
function resolveRepo(repo) {
    const local = join(WORKSPACE, repo);
    if (existsSync(join(local, '.git'))) return local;
    const dest = join(TMP, repo);
    execFileSync('git', ['clone', '--depth', '1', '--quiet',
        `https://github.com/TikTzuki/${repo}.git`, dest], {stdio: ['ignore', 'ignore', 'inherit']});
    return dest;
}

function loadManifest(root) {
    const p = join(root, 'knowledge-map.yaml');
    return existsSync(p) ? yaml.load(readFileSync(p, 'utf8')) ?? {} : {};
}

/** Merge front-matter keys into a doc, never overwriting a key the source already set. */
function injectFrontMatter(file, meta) {
    const raw = readFileSync(file, 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    const existing = m ? yaml.load(m[1]) ?? {} : {};
    const merged = {...meta, ...existing};      // source repo wins, same rule as _category_.yaml
    if (Object.keys(merged).length === 0) return;
    const body = m ? raw.slice(m[0].length) : raw;
    const fm = yaml.dump(merged, {lineWidth: -1, quotingType: '"', forceQuotes: false}).trimEnd();
    writeFileSync(file, `---\n${fm}\n---\n\n${body.replace(/^\n+/, '')}`);
}

function writeCategory(dir, {label, position, slug}) {
    const p = join(dir, '_category_.yaml');
    if (existsSync(p)) return;                  // the source repo controls its own label
    mkdirSync(dir, {recursive: true});
    writeFileSync(p, `label: ${label}\nposition: ${position}\nlink:\n  type: generated-index\n` +
        (slug ? `  slug: ${slug}\n` : ''));
}

function stamp(dir, origin) {
    writeFileSync(join(dir, '.synced-from'),
        `${origin}\nDo not edit these files here. This directory is overwritten by\n` +
        `scripts/sync-knowledge.mjs on every build. Edit them in the repo named above.\n`);
}

function walk(dir, ext = ['.md', '.mdx']) {
    const out = [];
    for (const e of readdirSync(dir, {withFileTypes: true})) {
        const p = join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p, ext));
        else if (ext.some((x) => e.name.endsWith(x))) out.push(p);
    }
    return out;
}

/**
 * A vi translation shadows an English doc by path. If the English file is renamed in its
 * source repo the shadow stops shadowing and silently becomes a vi-only page. Turn that
 * into a red build instead.
 */
function checkTranslationShadows(dest) {
    const l10n = join(I18N, dest);
    if (!existsSync(l10n)) return;
    for (const vf of walk(l10n)) {
        const counterpart = join(DOCS, dest, relative(l10n, vf));
        if (!existsSync(counterpart)) {
            die(`vi translation ${relative(I18N, vf)} has no English counterpart at ` +
                `docs/${dest}/${relative(l10n, vf)} — the source doc was renamed or removed.`);
        }
    }
}

/**
 * Rewrite relative `.md` links between synced files into absolute doc URLs, in the COPY only.
 *
 * The sources must keep relative `.md` links: production-review/SKILL.md and the lessons
 * themselves link that way, and the plugin follows them on disk through
 * ${CLAUDE_PLUGIN_ROOT}. But Docusaurus resolves a relative `.md` link against the set of
 * files present for the locale being built, and a translated file replaces its English
 * original in that set. So the moment ONE file in a directory is translated, every
 * untranslated sibling that links to it fails to resolve and the locale build dies.
 *
 * Rewriting to `/docs/<dest>/<name>` resolves by URL instead of by file, which is
 * translation-state independent. Fenced code blocks are skipped — a relative link inside a
 * ``` block is sample text, not a link.
 */
function rewriteInternalLinks(destDir, dest) {
    const files = walk(destDir);
    const known = new Set(files.map((f) => relative(destDir, f).replace(/\.mdx?$/, '')));
    let rewritten = 0;
    for (const file of files) {
        const src = readFileSync(file, 'utf8');
        const out = src
            .split(/(^```[\s\S]*?^```$)/m)          // keep fenced blocks as untouched chunks
            .map((chunk, i) => {
                if (i % 2 === 1) return chunk;          // odd chunks are the fences themselves
                return chunk.replace(
                    /\]\((?!https?:|\/|#)([^)\s#]+)\.mdx?(#[^)\s]*)?\)/g,
                    (whole, target, anchor = '') => {
                        if (!known.has(target)) return whole; // not a sibling we synced — leave it alone
                        rewritten++;
                        return `](/docs/${dest}/${target}${anchor})`;
                    },
                );
            })
            .join('');
        if (out !== src) writeFileSync(file, out);
    }
    return rewritten;
}

/** Copy a whole directory subtree, then apply manifest metadata to the copies. */
function syncTree({repo, src, dest, label, position, slug}) {
    const root = resolveRepo(repo);
    const from = join(root, src);
    if (!statSync(from, {throwIfNoEntry: false})?.isDirectory()) {
        die(`${repo}/${src} not found (looked in ${root})`);
    }
    const to = join(DOCS, dest);
    rmSync(to, {recursive: true, force: true});
    mkdirSync(to, {recursive: true});
    cpSync(from, to, {recursive: true});        // keeps images and nested structure
    if (label) writeCategory(to, {label, position, slug});
    stamp(to, `${repo}/${src}`);
    const links = rewriteInternalLinks(to, dest);
    checkTranslationShadows(dest);
    return {root, count: walk(to).length, links};
}

/** Route individual files named in a source repo's manifest to their site destinations. */
function syncManifestFiles(repo, root, manifest) {
    const publish = manifest.publish ?? {};
    for (const [dir, cat] of Object.entries(manifest.categories ?? {})) {
        writeCategory(join(DOCS, dir), cat);
    }
    let n = 0;
    for (const [src, spec] of Object.entries(publish)) {
        const from = join(root, src);
        if (!existsSync(from)) {
            warn(`${repo}: ${src} listed in knowledge-map.yaml but missing`);
            continue;
        }
        const to = join(DOCS, spec.to);
        mkdirSync(dirname(to), {recursive: true});
        cpSync(from, to);
        const {to: _drop, ...meta} = spec;
        injectFrontMatter(to, meta);
        n++;
    }
    return n;
}

/** Apply per-file metadata from a manifest to an already-copied tree. */
function applyLessonMeta(repo, dest, manifest) {
    const lessons = manifest.lessons ?? {};
    let tagged = 0, untagged = [];
    for (const f of walk(join(DOCS, dest))) {
        const name = relative(join(DOCS, dest), f);
        const spec = lessons[name];
        if (!spec) {
            untagged.push(name);
            continue;
        }
        const {group: _g, ...meta} = spec;
        injectFrontMatter(f, meta);
        tagged++;
    }
    for (const n of untagged) warn(`${repo}: ${n} has no knowledge-map.yaml entry — published untagged`);
    for (const name of Object.keys(lessons)) {
        if (!existsSync(join(DOCS, dest, name))) warn(`${repo}: knowledge-map.yaml lists ${name}, which no longer exists`);
    }
    return tagged;
}

console.log('Syncing knowledge from source-of-truth repos...');

// ---- tiktuzki-gitops: the operations tree, plus manifest-routed docs from infra/ and charts/
{
    const {root, count, links} = syncTree({
        repo: 'tiktuzki-gitops', src: 'docs/operations', dest: 'operations',
        label: 'Operations', position: 40, slug: '/category/operations',
    });
    const manifest = loadManifest(root);
    const extra = syncManifestFiles('tiktuzki-gitops', root, manifest);
    console.log(`  ${count} docs + ${extra} routed  <-  tiktuzki-gitops`);
}

// ---- senior-architect: 41 lessons, flat and unmoved, metadata injected into the copies
{
    const {root, count, links} = syncTree({
        repo: 'senior-architect',
        src: 'plugins/production-patterns/skills/production-review/references',
        dest: 'production-patterns',
        label: 'Production patterns', position: 20, slug: '/category/production-patterns',
    });
    const manifest = loadManifest(root);
    const tagged = applyLessonMeta('senior-architect', 'production-patterns', manifest);
    // The sidebar generator needs the group map; hand it over as build input.
    writeFileSync(join(SITE, '.lesson-groups.json'),
        JSON.stringify({
            groups: manifest.groups ?? {},
            byFile: Object.fromEntries(Object.entries(manifest.lessons ?? {})
                .map(([f, s]) => [f.replace(/\.mdx?$/, ''), s.group]))
        }, null, 2));
    console.log(`  ${count} docs (${tagged} tagged)  <-  senior-architect`);
}

console.log('Done.');
