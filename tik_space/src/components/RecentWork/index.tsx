import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';

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
 * A function so translate() runs in the reader's locale.
 */
function recent(): Entry[] {
    const cluster = translate({id: 'home.recent.area.cluster', message: 'K8s dev cluster'});
    return [
        {
            title: translate({id: 'home.recent.backup.title', message: 'Backing up the cluster'}),
            to: '/docs/operations/backup-restore/backup-flow',
            area: cluster,
            note: translate({id: 'home.recent.backup.note', message: 'Git already holds the desired state, so backup only has to capture what it does not — now via nightly S3 upload.'}),
        },
        {
            title: translate({id: 'home.recent.rebuild.title', message: 'Rebuilding node1 from scratch'}),
            to: '/docs/operations/cluster/cluster-rebuild',
            area: cluster,
            note: translate({id: 'home.recent.rebuild.note', message: 'A run-it-yourself checklist from bare MicroK8s to a working cluster, in the order things actually have to happen.'}),
        },
        {
            title: translate({id: 'home.recent.kubectl.title', message: 'kubectl credentials for a personal account'}),
            to: '/docs/operations/access/kubectl-credentials',
            area: cluster,
            note: translate({id: 'home.recent.kubectl.note', message: 'MicroK8s ships one shared admin cert. Minting named X.509 users so audit logs can tell people apart.'}),
        },
        {
            title: translate({id: 'home.recent.websocket.title', message: 'WebSocket gateway cluster'}),
            to: '/docs/system-design/websocket-gateway/cluster-sdd',
            area: translate({id: 'home.recent.area.systemDesign', message: 'System design'}),
            note: translate({id: 'home.recent.websocket.note', message: 'Streaming exchange events to end users: fan-out, backpressure, and what falls over first under load.'}),
        },
    ];
}

export default function RecentWork(): ReactNode {
    return (
        <section className={styles.section}>
            <Heading as="h2" className={styles.sectionTitle}>
                <Translate id="home.recent.heading">Recently written</Translate>
            </Heading>

            <ol className={styles.list}>
                {recent().map((entry) => (
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
                <Translate id="home.recent.blogArchive">Blog archive</Translate>
            </Link>
        </section>
    );
}
