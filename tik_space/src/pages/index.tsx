import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
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
        {/* siteConfig.tagline is never localized by Docusaurus, so the hero carries its own. */}
        <p className="hero__subtitle">
            <Translate id="home.hero.tagline">
                Stare at the abyss long enough, and it starts to stare back at you...
            </Translate>
        </p>
        <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/docs/category/production-patterns">
                <Translate id="home.hero.startReading">Start reading</Translate>
            </Link>
            <Link className="button button--outline button--lg" to="https://github.com/TikTzuki">
                <Translate id="home.hero.aboutMe">About me</Translate>
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
        description={translate({
            id: 'home.meta.description',
            message: 'Working notes on distributed backends: Kubernetes operations, WebSocket and MPC system design, elliptic-curve cryptography, libp2p networking and consensus protocols.',
        })}>
      <HomepageHeader />
      <main>
          <KnowledgeAreas/>
          <RecentWork/>
      </main>
    </Layout>
  );
}
