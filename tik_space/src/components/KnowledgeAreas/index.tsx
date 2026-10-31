import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';

import styles from './styles.module.scss';

type Area = {
    /** Doc-id prefix for this area. Used to count its pages at render time. */
    prefix: string;
    title: string;
    blurb: string;
    to: string;
    topics: string[];
    /** Optional single stand-out link promoted inside the card. */
    highlight?: { label: string; to: string };
};

/**
 * The six areas the site actually has depth in. Page counts are not written
 * here — they come from the docs plugin's global data so they cannot drift out
 * of sync with the filesystem. A function, not a constant, so translate() runs in
 * the reader's locale at render time.
 */
function areas(): Area[] {
    return [
        {
            prefix: 'production-patterns/',
            title: translate({id: 'home.areas.production.title', message: 'Production patterns'}),
            to: '/docs/category/production-patterns',
            blurb: translate({
                id: 'home.areas.production.blurb',
                message:
                    'The failure modes that only appear under concurrency, retries and real traffic — and that pass review because they work fine in development. Grouped by the subsystem they bite: runtime, storage, transactions, data modelling, APIs, distribution, and payments.',
            }),
            topics: ['Concurrency', 'Idempotency', 'Transactions', 'Payments'],
            highlight: {
                label: translate({id: 'home.areas.production.highlight', message: 'Browse by tier'}),
                to: '/docs/tags/tier-1-foundations',
            },
        },
        {
            prefix: 'operations/',
            title: translate({id: 'home.areas.operations.title', message: 'Operations'}),
            to: '/docs/category/operations',
            blurb: translate({
                id: 'home.areas.operations.blurb',
                message:
                    'Running MicroK8s on one bare-metal node with no public IP: a NetBird overlay for reachability, Nginx Proxy Manager in front, per-person RBAC certificates, S3 backups, and a rebuild checklist for when it all has to come back from nothing.',
            }),
            topics: ['MicroK8s', 'NetBird', 'ArgoCD', 'Patroni', 'RBAC'],
        },
        {
            prefix: 'system-design/',
            title: translate({id: 'home.areas.systemDesign.title', message: 'System design'}),
            to: '/docs/category/system-design',
            blurb: translate({
                id: 'home.areas.systemDesign.blurb',
                message:
                    'WebSocket gateway clusters built to fan out exchange events at low latency, MPC crypto-custody over NATS with authenticated encryption, recurring billing, and the SDD template the rest are written against.',
            }),
            topics: ['WebSocket', 'NATS', 'MPC', 'Billing'],
        },
        {
            prefix: 'how-it-works/cryptography/',
            title: translate({id: 'home.areas.cryptography.title', message: 'Cryptography'}),
            to: '/docs/category/cryptography',
            blurb: translate({
                id: 'home.areas.cryptography.blurb',
                message:
                    'Elliptic curves from the group law upward — what ECC actually computes, how ECDSA signs with it, why secp256k1 picks the parameters it does, and the modular inverse the whole thing rests on.',
            }),
            topics: ['ECC', 'ECDSA', 'secp256k1'],
            highlight: {
                label: translate({id: 'home.areas.cryptography.highlight', message: 'Interactive point-addition demo'}),
                to: '/cryptography/elliptic-demo',
            },
        },
        {
            prefix: 'how-it-works/libp2p/',
            title: translate({id: 'home.areas.networking.title', message: 'Networking'}),
            to: '/docs/category/libp2p',
            blurb: translate({
                id: 'home.areas.networking.blurb',
                message:
                    'rust-libp2p in practice: the transport and muxing stack, the protocols everything else is built on, NAT traversal when neither peer is addressable, and a decentralised p2p playground to try it in.',
            }),
            topics: ['libp2p', 'Rust', 'NAT traversal', 'p2p'],
        },
        {
            prefix: 'how-it-works/consensus/',
            title: translate({id: 'home.areas.consensus.title', message: 'Consensus'}),
            to: '/docs/category/consensus',
            blurb: translate({
                id: 'home.areas.consensus.blurb',
                message:
                    'Why agreement across replicas is hard, and two protocols that manage it anyway — Raft, which elects a leader everyone trusts, and Viewstamped Replication, which changes view when that leader stops answering.',
            }),
            topics: ['Raft', 'VSR', 'Replication'],
        },
    ];
}

/** Smaller corners of the site, listed rather than given a full card. */
function also(): { label: string; to: string; prefix: string }[] {
    return [
        {label: translate({id: 'home.also.interviewPrep', message: 'Interview prep'}), to: '/docs/category/interview-prep', prefix: 'interview-prep/'},
        {label: translate({id: 'home.also.reference', message: 'Reference'}), to: '/docs/category/reference', prefix: 'reference/'},
        {label: translate({id: 'home.also.trading', message: 'Trading'}), to: '/docs/category/trading', prefix: 'how-it-works/trading/'},
        {label: translate({id: 'home.also.tags', message: 'Browse by tag'}), to: '/docs/tags', prefix: ''},
        {label: translate({id: 'home.also.archive', message: 'Archive'}), to: '/docs/category/archive', prefix: 'archive/'},
    ];
}

/**
 * Counts docs per id prefix from the docs plugin's global data.
 * Falls back to an empty map if the shape ever changes, in which case the
 * cards simply render without a count rather than breaking the build.
 */
function useDocCounts(prefixes: string[]): Record<string, number> {
    const allDocsData = useAllDocsData();
    const docs = allDocsData?.default?.versions?.[0]?.docs ?? [];
    return Object.fromEntries(
        prefixes.map((prefix) => [prefix, docs.filter((doc) => doc.id.startsWith(prefix)).length]),
    );
}

function pages(n: number): string {
    return n === 1
        ? translate({id: 'home.areas.onePage', message: '1 page'})
        : translate({id: 'home.areas.pages', message: '{count} pages'}, {count: n});
}

function AreaCard({area, index, count}: { area: Area; index: number; count: number }): ReactNode {
    return (
        <article className={styles.card}>
      <span className={styles.index} aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>

            <Heading as="h3" className={styles.cardTitle}>
                <Link className={styles.cardLink} to={area.to}>
                    {area.title}
                </Link>
            </Heading>

            <p className={styles.blurb}>{area.blurb}</p>

            <ul className={styles.topics}>
                {area.topics.map((topic) => (
                    <li key={topic} className={styles.topic}>
                        {topic}
                    </li>
                ))}
            </ul>

            {area.highlight && (
                <Link className={styles.highlight} to={area.highlight.to}>
                    {area.highlight.label}
                </Link>
            )}

            <p className={styles.count}>{pages(count)}</p>
        </article>
    );
}

export default function KnowledgeAreas(): ReactNode {
    const AREAS = areas();
    const ALSO = also();
    const counts = useDocCounts([...AREAS.map((a) => a.prefix), ...ALSO.map((a) => a.prefix)]);

    return (
        <section className={styles.section}>
            <Heading as="h2" className={styles.sectionTitle}>
                <Translate id="home.areas.heading">What's in here</Translate>
            </Heading>
            <p className={styles.sectionLede}>
                <Translate id="home.areas.lede">
                    Working notes from building backends — mostly distributed systems, the infrastructure under them, and the maths a few of them depend on. Written to be re-read later, by me.
                </Translate>
            </p>

            <div className={styles.grid}>
                {AREAS.map((area, i) => (
                    <AreaCard key={area.prefix} area={area} index={i} count={counts[area.prefix] ?? 0}/>
                ))}
            </div>

            <p className={styles.also}>
                <span className={styles.alsoLabel}>
                    <Translate id="home.also.label">Also here</Translate>
                </span>
                {ALSO.map((item) => (
                    <Link key={item.prefix} className={styles.alsoLink} to={item.to}>
                        {item.label}
                        <span className={styles.alsoCount}>{counts[item.prefix] ?? 0}</span>
                    </Link>
                ))}
            </p>
        </section>
    );
}
