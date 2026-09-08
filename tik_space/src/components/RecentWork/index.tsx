import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

import styles from './styles.module.scss';

type Entry = {
    title: string;
    to: string;
    area: string;
    note: string;
};

/**
 * Hand-picked rather than generated: Docusaurus exposes no "last updated"
 * ordering across the whole doc set at build time, and the useful ordering here
 * is editorial anyway. Add new writing to the top and drop the last entry.
 */
const RECENT: Entry[] = [
    {
        title: 'Backing up the cluster',
        to: '/docs/operations/backup-restore/backup-flow',
        area: 'K8s dev cluster',
        note: 'Git already holds the desired state, so backup only has to capture what it does not — now via nightly S3 upload.',
    },
    {
        title: 'Rebuilding node1 from scratch',
        to: '/docs/operations/cluster/cluster-rebuild',
        area: 'K8s dev cluster',
        note: 'A run-it-yourself checklist from bare MicroK8s to a working cluster, in the order things actually have to happen.',
    },
    {
        title: 'kubectl credentials for a personal account',
        to: '/docs/operations/access/kubectl-credentials',
        area: 'K8s dev cluster',
        note: 'MicroK8s ships one shared admin cert. Minting named X.509 users so audit logs can tell people apart.',
    },
    {
        title: 'WebSocket gateway cluster',
        to: '/docs/system-design/websocket-gateway/cluster-sdd',
        area: 'System design',
        note: 'Streaming exchange events to end users: fan-out, backpressure, and what falls over first under load.',
    },
];

export default function RecentWork(): ReactNode {
    return (
        <section className={styles.section}>
            <Heading as="h2" className={styles.sectionTitle}>
                Recently written
            </Heading>

            <ol className={styles.list}>
                {RECENT.map((entry) => (
                    <li key={entry.to} className={styles.item}>
                        <Link className={styles.link} to={entry.to}>
                            <span className={styles.area}>{entry.area}</span>
                            <span className={styles.title}>{entry.title}</span>
                            <span className={styles.note}>{entry.note}</span>
                            <span className={styles.arrow} aria-hidden="true">
                →
              </span>
                        </Link>
                    </li>
                ))}
            </ol>

            <Link className={styles.more} to="/blog">
                Blog archive
            </Link>
        </section>
    );
}
