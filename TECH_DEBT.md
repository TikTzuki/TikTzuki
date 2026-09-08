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

---

## 6. Content and i18n

### 6.1 The `vi` locale has exactly one translated page

Translation has restarted rather than being dropped: `production-patterns/session-consistency.md`
is a full Vietnamese translation. Everything else under `/vi/` still falls back to English, so the
language switcher remains mostly misleading — one page in, ~90 to go.

The decision from the original entry (repopulate vs. drop `vi`) is now settled in favour of
repopulating, but incrementally. Each new translation costs a file and nothing else, because §6.2
is solved.

- Verify: `find i18n/vi -name '*.md' -o -name '*.mdx' | wc -l`  (currently 1)

### 6.2 Relative `.md` links break in a partially translated locale — solved for synced content

The hazard this entry predicted materialised the moment the first translation landed: translating
`production-patterns/session-consistency.md` broke the `vi` build, because the four untranslated
storage-set siblings link to it by relative `.md` path and a translated file replaces its English
original in the locale's resolvable file set.

It is **not** fixable by editing the lessons: they must keep relative `.md` links, since
`production-review/SKILL.md` and the lessons themselves are followed on disk through
`${CLAUDE_PLUGIN_ROOT}`, and 347 such links run between the 42 files.

`scripts/sync-knowledge.mjs` therefore rewrites `](name.md)` to `](/docs/<dest>/name)` **in the
copies only**, skipping fenced code blocks. Sources stay file-relative for the plugin; published
copies are URL-linked and so translation-state independent.

Two things this does not cover, and both bite silently:

- **Site-native files are not rewritten.** Anything authored directly under `i18n/vi/` or `docs/`
  (as opposed to synced in) must use URL-style links by hand. The `vi` translation does.
- The rewrite only matches links whose target is a **sibling in the same synced directory**.
  A cross-directory `.md` link would be left alone and would fail the same way.

- Verify: `grep -rho '](\([a-z0-9-]*\)\.md)' docs/production-patterns/ | sort -u` → must be empty

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
