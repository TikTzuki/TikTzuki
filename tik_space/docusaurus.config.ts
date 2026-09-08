import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {persona4PrismDark, persona4PrismLight,} from './src/themes/persona4/prism';
import {sidebarItemsGenerator} from './sidebarItemsGenerator';
import docsRedirects from './redirects.json';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: "Tiktuzki's space",
    tagline: 'Stare at the abyss long enough, and it starts to stare back at you...',
    favicon: 'img/favicon.ico',
    themes: ['@docusaurus/theme-mermaid'],
    // In order for Mermaid code blocks in Markdown to work,
    // you also need to enable the Remark plugin with this option
    markdown: {
        mermaid: true,
        hooks: {
            // Default is 'warn'. A relative .md link to a moved file would only warn and
            // then render a raw href, which is exactly the breakage a restructure causes.
            onBrokenMarkdownLinks: 'throw',
        },
    },
    plugins: [
        'docusaurus-plugin-sass',
        [
            '@docusaurus/plugin-client-redirects',
            {
                // Generated from a build-to-build sitemap diff, not written by hand.
                // See redirects.json; every URL the restructure removed is listed there.
                // Paths are relative to baseUrl, so one entry covers en and vi.
                redirects: docsRedirects,
            },
        ],
    ],
    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: {
        v4: true, // Improve compatibility with the upcoming Docusaurus v4
    },

    // Set the production url of your site here
    url: 'https://tiktzuki.github.io',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'TikTzuki', // GitHub org/user name.
    projectName: 'tiktzuki.github.io', // Repo the built site is pushed to.
    deploymentBranch: 'master',
    onBrokenLinks: 'throw',
    onBrokenAnchors: 'throw', // default is 'warn'

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'vi'],
        localeConfigs: {
            en: {label: 'English', htmlLang: 'en-GB'},
            vi: {label: 'Tiếng Việt', direction: 'ltr'},
        },
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    // Regroups the flat 41-lesson category into its seven sets in memory.
                    // See sidebars.ts for why the files themselves must not move.
                    sidebarItemsGenerator,
                    // Controlled vocabulary. 'throw' means an undefined tag fails the
                    // build, which is what stops the taxonomy decaying into decoration.
                    tags: 'tags.yml',
                    onInlineTags: 'throw',
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/TikTzuki/tiktzuki.github.io/tree/master/',
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ['rss', 'atom'],
                        xslt: true,
                    },
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/TikTzuki/tiktzuki.github.io/tree/master/',
                    // Useful options to enforce blogging best practices
                    onInlineTags: 'warn',
                    onInlineAuthors: 'warn',
                    onUntruncatedBlogPosts: 'warn',
                },
                theme: {
                    customCss: './src/css/custom.scss',
                },
            } satisfies Preset.Options,
        ],
    ],
    headTags: [
        {
            tagName: 'link',
            attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'preconnect',
                href: 'https://fonts.gstatic.com',
                crossorigin: 'anonymous',
            },
        },
    ],
    stylesheets: [
        // Archivo Black for display type, Inter for body and UI.
        'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800&display=swap',
        {
            href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
            type: 'text/css',
            integrity:
                'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
            crossorigin: 'anonymous',
        },
    ],
    themeConfig: {
        // Replace with your project's social card
        image: 'img/social-card.png',
        navbar: {
            title: 'Tiktuzki\'s space',
            logo: {
                alt: 'My Site Logo',
                src: 'img/favicon.ico',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docSidebar',
                    position: 'left',
                    label: 'Docs',
                },
                {to: '/blog', label: 'Blog', position: 'left'},
                {
                    type: 'localeDropdown',
                    position: 'right',
                },
                {
                    href: 'https://github.com/TikTzuki',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Learn',
                    items: [
                        {label: 'How it works', to: '/docs/category/how-it-works'},
                        {label: 'Production patterns', to: '/docs/category/production-patterns'},
                        {label: 'Interview prep', to: '/docs/category/interview-prep'},
                    ],
                },
                {
                    title: 'Build & run',
                    items: [
                        {label: 'System design', to: '/docs/category/system-design'},
                        {label: 'Operations', to: '/docs/category/operations'},
                        {label: 'Reference', to: '/docs/category/reference'},
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {label: 'Browse by tag', to: '/docs/tags'},
                        {label: 'Blog', to: '/blog'},
                        {label: 'GitHub', href: 'https://github.com/TikTzuki'},
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} TikTuzki. Built with Docusaurus.`,
        },
        prism: {
            theme: persona4PrismLight,
            darkTheme: persona4PrismDark,
        },
        mermaid: {
            // 'base' is the only Mermaid theme that honours themeVariables in
            // full, which is what lets diagrams inherit the P4 palette.
            theme: {light: 'base', dark: 'base'},
            options: {
                themeVariables: {
                    fontFamily: "'Inter', system-ui, sans-serif",
                    primaryColor: '#ffe100',
                    primaryTextColor: '#0a0a0b',
                    primaryBorderColor: '#0a0a0b',
                    lineColor: '#8c6a00',
                    secondaryColor: '#fff5c2',
                    tertiaryColor: '#fffbe8',
                },
            },
        },
        colorMode: {
            defaultMode: 'dark'
        }
    } satisfies Preset.ThemeConfig,
};

export default config;
