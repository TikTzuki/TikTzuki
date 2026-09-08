import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import KnowledgeAreas from '@site/src/components/KnowledgeAreas';
import RecentWork from '@site/src/components/RecentWork';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/docs/category/production-patterns">
                Start reading
            </Link>
            <Link className="button button--outline button--lg" to="https://github.com/TikTzuki">
                About me
            </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
        title={siteConfig.title}
        description="Working notes on distributed backends: Kubernetes operations, WebSocket and MPC system design, elliptic-curve cryptography, libp2p networking and consensus protocols.">
      <HomepageHeader />
      <main>
          <KnowledgeAreas/>
          <RecentWork/>
      </main>
    </Layout>
  );
}
