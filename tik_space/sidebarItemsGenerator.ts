import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * The 41 production-pattern lessons live in ONE flat directory and must stay that way:
 * `production-review/SKILL.md` links all 41 by relative path and the plugin resolves them
 * through `${CLAUDE_PLUGIN_ROOT}`, and 347 relative links run between the files, 100 of
 * which cross a "set" boundary. The sets are a graph, not a folder structure.
 *
 * So the grouping is applied to the SIDEBAR instead of the filesystem. `scripts/
 * sync-knowledge.mjs` writes `.lesson-groups.json` from senior-architect's
 * `knowledge-map.yaml`; this regroups the flat category in memory. Zero files move, zero
 * doc ids change, zero links break, and a new lesson in the source repo needs no change
 * here — it simply appears in its group once the manifest names it.
 */
// Docusaurus loads this file as CJS, so no import.meta. It always runs with the
// site directory as cwd.
const GROUPS_FILE = join(process.cwd(), '.lesson-groups.json');

type LessonGroups = { groups: Record<string, string>; byFile: Record<string, string> };

function loadLessonGroups(): LessonGroups | undefined {
    if (!existsSync(GROUPS_FILE)) return undefined; // sync has not run yet
    try {
        return JSON.parse(readFileSync(GROUPS_FILE, 'utf8')) as LessonGroups;
    } catch {
        return undefined;
    }
}

/** Replace the flat production-patterns category's doc items with one sub-category per set. */
function regroupLessons(items: any[], lg: LessonGroups): any[] {
    return items.map((item) => {
        if (item.type !== 'category') return item;
        const isLessons = item.items?.some(
            (i: any) => i.type === 'doc' && String(i.id).startsWith('production-patterns/'),
        );
        if (!isLessons) return {...item, items: regroupLessons(item.items ?? [], lg)};

        const buckets = new Map<string, any[]>();
        const loose: any[] = [];
        for (const i of item.items) {
            const key = i.type === 'doc' ? lg.byFile[String(i.id).replace('production-patterns/', '')] : undefined;
            if (!key) loose.push(i);
            else (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(i);
        }
        // Preserve the manifest's group order rather than alphabetising.
        const ordered = Object.keys(lg.groups).filter((g) => buckets.has(g));
        return {
            ...item,
            items: [
                ...ordered.map((g) => ({
                    type: 'category' as const,
                    label: lg.groups[g],
                    key: `production-patterns-${g}`, // stable key for i18n across relabels
                    collapsed: true,
                    items: buckets.get(g)!,
                })),
                ...loose, // anything the manifest does not name stays visible, not dropped
            ],
        };
    });
}

const sidebarItemsGenerator = async ({
                                         defaultSidebarItemsGenerator,
                                         ...args
                                     }) => {
    const items = await defaultSidebarItemsGenerator(args);
    const lg = loadLessonGroups();
    return lg ? regroupLessons(items, lg) : items;
};

export {sidebarItemsGenerator};
