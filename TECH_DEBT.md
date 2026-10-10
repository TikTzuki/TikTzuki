# Known issues and technical debt

Running record of things that are wrong, deferred, or fragile in this repo, so they can be
re-reviewed instead of rediscovered. Each entry says what is wrong, why it matters, where it
lives, and how to check whether it is still true.

Unless stated otherwise, commands run from `tik_space/`.

Last reviewed: **2026-09-03** (all entries below verified against the tree on that date).

---

## 1. Live defects

### 1.1 Buttons are unreadable on the elliptic-curve demo in dark mode

**Severity: high** — dark is the site default, so this is what most visitors see.

`src/components/ui/styles.module.scss` hardcodes `color: #ffffff` on a button whose background is
`var(--ifm-color-primary)`. That was fine under the old purple palette. Under the Persona 4 palette
the dark-mode primary is `#ffe100`, so the buttons render **white on bright yellow — 1.06:1**.
Light mode is fine (white on `#8c6a00` ≈ 5:1).

The same file still carries other pre-theme leftovers: a purple focus ring
`rgba(105, 74, 217, 0.25)`, and hardcoded greys `#666666`, `#f0f0f0`, `#d0d0d0`, `#1a1a1a`
that ignore the colour mode entirely.

- Where: `src/components/ui/styles.module.scss`
- Only consumer: `src/pages/cryptography/elliptic-demo.tsx`
- Fix: move the whole file onto theme variables. Button text on a yellow ground must be
  `var(--p4-ink)`, not white; the focus ring should use `--ifm-color-primary`.
- Verify: open `/cryptography/elliptic-demo` with the dark theme and look at the
  Real Curve / Mod p Curve / Generate buttons.

**Why the earlier accessibility sweep missed it:** the audit script only visited `/`, `/docs/intro`,
`/blog` and three doc pages. Standalone pages under `src/pages/` were never in the list.
Whatever check replaces it should enumerate routes from the build output rather than a hand-written array.

### 1.2 Deep import into Docusaurus internals

`src/pages/cryptography/elliptic-demo.tsx:5` imports from
`@docusaurus/core/lib/client/exports/useDocusaurusContext` — an internal build path, not the public
`@docusaurus/useDocusaurusContext`. It works today but is not covered by semver and will break on
some future upgrade with a confusing error.

- Verify: `grep -rn "@docusaurus/core/lib" src`

---

## 2. Build and tooling

### 2.1 `pnpm build` alone can produce a stale bundle

**This bit twice during the theming work.** A change to `src/themes/persona4/index.scss` built with
exit code 0 and `[SUCCESS]`, while the emitted CSS still contained the *previous* value — which
silently invalidated a round of visual verification. `pnpm clear` first made it correct.

Suspected cause: the Rspack persistent cache introduced with `@docusaurus/faster` (added in the
3.10 upgrade because `future.v4: true` now implies it). Not root-caused.

- Until it is understood, treat `pnpm clear && pnpm build` as the only trustworthy build,
  and be suspicious of any theme change that "did not seem to apply".
- Verify a suspected stale build: `grep -o '\-\-<some-var>:[^;]*' build/assets/css/*.css`
  and compare against the source.

### 2.2 Browserslist data is stale

Every build prints `browsers data (caniuse-lite) is 7 months old`. Harmless but noisy, and it means
autoprefixing targets are based on old usage data. Fix: `npx update-browserslist-db@latest`.

### 2.3 `package-lock.json` still exists next to `pnpm-lock.yaml`

The project is pnpm-only (`engines`, CI, and every documented command). The npm lockfile is stale
and will mislead anyone who runs `npm install`. It should be deleted.

- Verify: `ls package-lock.json`

### 2.4 `png-to-ico` is an unused dependency

Declared in `package.json` (`^3.0.2`) but referenced nowhere in the repo. It was bumped across a
major version during the 3.10 upgrade without anything actually depending on it.

- Verify: `grep -rn "png-to-ico" src docs blog static *.ts` — only `package.json` should match.

### 2.5 TypeScript deliberately held at 5.9.x

`typescript: ~5.9.3` while 7.0.2 exists. This is a considered pin, not an oversight: TS 7 is the
native compiler port and Docusaurus has not validated `@docusaurus/tsconfig` against it. Revisit once
Docusaurus states support.
===>  Use TypeScript 6.0 for newly initialized sites. However, it requires "ignoreDeprecations": "6.0" for now.

### 2.6 pnpm is pinned to 10.x on purpose

`package.json` pins `"packageManager": "pnpm@10.29.3"`, and `release_docs.yml` reads it through
`package_json_file`. pnpm 12 turns *"Ignored build scripts: @parcel/watcher, @swc/core, core-js"*
from a warning into a failed install. That is what broke every deploy from 2025-11-05 to
2026-10-10, while the committed workflow still said `version: latest`.

- Before raising the pin: decide which build scripts may run (`pnpm approve-builds`), commit that
  config, then bump.

---

## 3. Docusaurus 3.10 migration hazards

### 3.1 Titled admonitions silently degrade to plain text

3.10 **dropped** the unbracketed title form. `:::tip My tip` no longer parses — it renders as a
literal paragraph with **no build error and no warning**. The correct form is `:::tip[My tip]`.

42 occurrences were converted during the upgrade. The tree is clean today, but this is a permanent
trap because failures are invisible.

It matters most for `docs/operations/` and `docs/production-patterns/`, which are synced in from
sibling repos (see §5) — content authored in `tiktuzki-gitops` or `senior-architect` using the old
syntax will break here, silently, and cannot be fixed here.

- Verify: `grep -rnE '^[[:space:]]*:::[a-z-]+[[:space:]]+[^[:space:]\[]' docs` → must be empty.
- Worth doing: add exactly that check to `scripts/sync-knowledge.mjs` so a bad sync fails loudly.

---

## 4. Theme (`src/themes/persona4/`)

### 4.1 Mermaid theme variables cannot differ per colour mode

Docusaurus accepts a single `themeConfig.mermaid.options.themeVariables`, so light and dark share
one palette. The current values are light-surface colours chosen because they stay legible on both
grounds — the consequence is that **dark-mode diagrams have light node and edge-label boxes**, which
reads as a bright patch on a black page.

Doing this properly means swizzling the Mermaid theme component to swap variables on
`data-theme`. Deferred as not worth the maintenance burden yet.

### 4.2 `RecentWork` is a hand-maintained list

`src/components/RecentWork/index.tsx` hardcodes four entries. Nothing tells you when it goes stale;
new writing has to be added by hand. Docusaurus exposes no cross-doc "last updated" ordering at
build time, so automating it means reading git metadata in a plugin.

### 4.3 `KnowledgeAreas` hardcodes the site's shape

`src/components/KnowledgeAreas/index.tsx` derives **page counts** live from the docs plugin's global
data, so those cannot drift. But the area list, the category URLs and the blurbs are hardcoded — and
they went stale within a day when the docs tree was reorganised into `how-it-works/`, `operations/`,
`interview-prep/` and `reference/`. They have been updated, but the coupling remains: any future
reorganisation silently breaks the homepage's descriptions, and breaks the build via the links.

---

## 5. Coupling to the sync'd sibling repos

`docs/operations/` and `docs/production-patterns/` are **gitignored** and regenerated by
`pnpm sync` (`scripts/sync-knowledge.mjs`) from `tiktuzki-gitops` and `senior-architect`.

The homepage cards and the footer link to `/docs/category/operations` and
`/docs/category/production-patterns`. With `onBrokenLinks: 'throw'`, **a build in which the sync
produces nothing will fail** rather than degrade — for example if a sibling repo is renamed, its
`knowledge-map.yaml` `publish:` block changes, or a CI clone fails.

That is arguably the right failure mode, but it means the homepage cannot be built independently of
two other repositories. Worth being explicit about in the deploy runbook.

**`tiktuzki-gitops` is private (since 2026-10).** CI's clone authenticates with the repo secret
`KNOWLEDGE_TOKEN` — a fine-grained PAT scoped to `tiktuzki-gitops` only, Contents read-only — passed
to both the sync and build steps (`pnpm build` re-runs the sync). **When that token expires, the
nightly build fails** with `could not clone TikTzuki/tiktuzki-gitops`. Rotate it before its expiry
date.

---

## 6. Content and i18n

### 6.1 The `vi` locale was removed — the site is English-only

`locales: ['en']`. The `vi` locale reached **1 translated page out of ~90**, so `/vi/**` was
89 English pages served at Vietnamese URLs, plus a language switcher offering a choice the
content could not honour.

Nothing broke by removing it: the deploy had **never published `/vi/`** (the gh-pages tree
contained 328 paths, none under `vi/`), so no live URL was lost and no redirects were needed.

Two facts worth keeping, because they are what made the locale unfixable at 1% coverage
rather than merely incomplete:

- **The homepage and its components cannot be translated as written.** `src/pages/index.tsx`,
  `KnowledgeAreas/index.tsx` and `RecentWork/index.tsx` contain zero `<Translate>` calls, so
  their strings never enter `code.json` and would render English in any locale. "What's in
  here", "Start reading", "Backend runtime" — all absent from the translation catalogue.
- **`siteConfig.tagline` is never localized by Docusaurus.** It is global config, so the hero
  subtitle is English in every locale by design.

The Vietnamese translation of the `session-consistency` lesson (≈250 lines) is recoverable
from commit `fe5b474` if it is ever wanted:
`git show fe5b474:tik_space/i18n/vi/docusaurus-plugin-content-docs/current/production-patterns/session-consistency.md`

To reintroduce a locale, budget for the two points above first, not just for translating
markdown.

### 6.2 Synced `.md` links are rewritten to URLs — motivation now dormant, keep the behaviour

`scripts/sync-knowledge.mjs` rewrites `](name.md)` to `](/docs/<dest>/name)` in the copies it
makes, skipping fenced code blocks. This was introduced because a partially translated locale
breaks relative `.md` links: a translated file replaces its English original in that locale's
resolvable set, so untranslated siblings linking to it fail to resolve and the build dies.

With one locale that failure mode cannot occur, so the rewrite is no longer load-bearing.
**Keep it anyway** — URL links are the more robust form, and it is the thing that makes adding
a locale cheap later. The sources stay file-relative, which is required: `production-review/
SKILL.md` and the 42 lessons are followed on disk through `${CLAUDE_PLUGIN_ROOT}`, with 347
relative links between them.

`checkTranslationShadows()` in the same script is likewise dormant and annotated as such.

- Verify: `grep -rho '](\([a-z0-9-]*\)\.md)' docs/production-patterns/ | sort -u` → empty

### 6.3 A blog post has no front matter

`blog/2025-10-26-mcp-atlassian-integration.md` has no front matter at all — no `title`, `authors`,
`slug` or `tags` — and no `<!-- truncate -->` marker, which the build warns about on every run. Its
title is inferred from the `# ` heading and it has no author attribution, unlike the other post.

### 4.4 `how-it-works/` subject ordering is append-only

Subjects are positioned in the order they were added: cryptography (1), consensus (2), libp2p (3),
trading (4), distributed-systems (5), estimation (6). Reading order would be better served by
putting the foundations first — `distributed-systems` and `estimation` before the specialist
subjects — since Raft and VSR assume the CAP and consistency vocabulary that now sits below them.
Left alone to avoid renumbering four existing `_category_.yaml` files as a side effect; it is a
four-line change whenever it is wanted.

---

## Resolved (kept so they are not re-raised)

- **Site frozen 2025-11-05 → 2026-10-10** — every deploy failed at `pnpm install` (§2.6). Fixed
  together with two problems hiding behind it: `pnpm sync` could not clone the now-private
  `tiktuzki-gitops` (§5), and a successful deploy would have deleted the hand-made `CNAME` on
  `gh-pages`, dropping www.tiktuzki.com. `CNAME` now comes from `cname:` on the deploy step.
- **Titled admonitions across the tree** — 42 occurrences converted to `:::tip[Title]` during the
  3.10 upgrade. The hazard for *incoming synced* content remains; see §3.1.
- **`pnpm typecheck` failing on `.module.scss` imports** — fixed by `src/scss.d.ts`.
- **Archived Docusaurus tutorial pages** — the `<Highlight>` demo carried two low-contrast colour
  swatches; the whole `docs/archive/tutorial-*` tree has since been deleted.
- **Stale Vietnamese `backup-flow.md`** — described the retired pg_dump/LVM flow rather than the S3
  strategy; deleted in the reorganisation.
- **Empty `notify-service-docs` category** — had a `_category_.yaml` and no pages; now
  `system-design/notification-service/`.
- **`docs/intro.md` placeholder** — was a stub explaining it existed only to satisfy links; now has
  proper front matter and is titled "Start here".
- **Dead `PageTree` component** — imported by the homepage but never rendered, with links to removed
  tutorial pages. Deleted along with `HomepageFeatures`.
- **`.DS_Store` untracked everywhere** — now in `.gitignore`.
- **Docusaurus template placeholders** — `organizationName`/`projectName` were `facebook`/`docusaurus`;
  the footer linked to Docusaurus's own Discord and Stack Overflow; the social card was the stock image.
